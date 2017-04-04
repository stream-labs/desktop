'use strict';

// Set up NODE_ENV
const pjson = require('./package.json');
if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
}
process.env.SLOBS_VERSION = pjson.version;

////////////////////////////////////////////////////////////////////////////////
// Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const { app, BrowserWindow, ipcMain } = require('electron');
const _ = require('lodash');
const boost = require(process.env.NODE_ENV !== 'production' ? './node-boost' : '../../node-boost');
const obs = require(process.env.NODE_ENV !== 'production' ? './node-obs' : '../../node-obs');

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

// Windows
let mainWindow;
let display;

let childWindow;

const indexUrl = 'file://' + __dirname + '/index.html';

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false,
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    display = obs.OBS_content_createDisplay(mainWindow.getNativeWindowHandle());
    console.log(display);
    mainWindow.show();

    /* Let the main preview know its own display handle */
    mainWindow.send('vuex-mutation', {
      type: 'SET_VIDEO_DISPLAY',  
      payload: { handle: display }
    });
  });

  mainWindow.loadURL(indexUrl);

  mainWindow.on('closed', () => {
    app.quit();
  });

  // Pre-initialize the child window
  childWindow = new BrowserWindow({
    show: false,
    frame: false
  });

  childWindow.loadURL(indexUrl + '?child=true');

  if (process.env.NODE_ENV !== 'production') {
    childWindow.webContents.openDevTools();
    mainWindow.webContents.openDevTools();

    const devtoolsInstaller = require('electron-devtools-installer');

    devtoolsInstaller.default(devtoolsInstaller.VUEJS_DEVTOOLS);
  }

  // Initialize various OBS services
  obs.OBS_API_initOBS_API();
  obs.OBS_API_openAllModules();
  obs.OBS_API_initAllModules();

  obs.OBS_service_createStreamingOutput();
  obs.OBS_service_createRecordingOutput();

  obs.OBS_service_createVideoStreamingEncoder();
  obs.OBS_service_createVideoRecordingEncoder();

  obs.OBS_service_createAudioEncoder();

  obs.OBS_service_resetAudioContext();
  obs.OBS_service_resetVideoContext();

  obs.OBS_service_associateAudioAndVideoToTheCurrentStreamingContext();
  obs.OBS_service_associateAudioAndVideoToTheCurrentRecordingContext();

  obs.OBS_service_createService();

  obs.OBS_service_associateAudioAndVideoEncodersToTheCurrentStreamingOutput();
  obs.OBS_service_associateAudioAndVideoEncodersToTheCurrentRecordingOutput();

  obs.OBS_service_setServiceToTheStreamingOutput();
  
  //Create a new child window and send the window handle to node-obs to create the display
  // let childWindowPreview = new BrowserWindow({parent: mainWindow});
  // var windowHandleBuffer = childWindowPreview.getNativeWindowHandle();
  // obs.OBS_content_createDisplay(mainWindow.getNativeWindowHandle());
});

ipcMain.on('window-showChildWindow', (event, data) => {
  if (data.windowOptions.width && data.windowOptions.height) {
    childWindow.setSize(data.windowOptions.width, data.windowOptions.height);
    childWindow.center();
  }

  childWindow.send('window-setContents', data.startupOptions);
  childWindow.show();
});

// The main process acts as a hub for various windows
// syncing their vuex stores.
let registeredStores = {};

ipcMain.on('vuex-register', event => {
  let win = BrowserWindow.fromWebContents(event.sender);
  let windowId = win.id;

  // Register can be received multiple times if the window is
  // refreshed.  We only want to register it once.
  if (!registeredStores[windowId]) {
    registeredStores[windowId] = win;
    console.log('Registered vuex stores: ', _.keys(registeredStores));

    // Make sure we unregister is when it is closed
    win.on('closed', () => {
      delete registeredStores[windowId];
      console.log('Registered vuex stores: ', _.keys(registeredStores));
    });
  }

  if (windowId !== mainWindow.id) {
    // Tell the mainWindow to send its current store state
    // to the newly registered window

    mainWindow.webContents.send('vuex-sendState', windowId);
  }
});

// Proxy vuex-mutation events to all other subscribed windows
ipcMain.on('vuex-mutation', (event, mutation) => {
  let windowId = BrowserWindow.fromWebContents(event.sender).id;

  _.each(_.omit(registeredStores, [windowId]), win => {
    win.webContents.send('vuex-mutation', mutation);
  });
});

// Proxy node OBS calls
ipcMain.on('obs-apiCall', (event, data) => {
  console.log('OBS API CALL', data);
  let retVal = obs[data.method].apply(obs, data.args);
  console.log('OBS RETURN VALUE', retVal);

  if (retVal instanceof ArrayBuffer) {
    // Base64 is an efficient way of serializing this data
    retVal = Buffer.from(retVal).toString('base64');
  }

  // electron ipc doesn't like returning undefined, so
  // we return null instead.
  event.returnValue = retVal || null;
});

// Used for guaranteeing unique ids for objects in the vuex store
ipcMain.on('getUniqueId', event => {
  event.returnValue = _.uniqueId();
});

////////////////////////////////////////////////////////////////////////////////
// Frame Transfer using Shared Memory
////////////////////////////////////////////////////////////////////////////////
const SourceFrame = require('./bundles/main_helpers.js').SourceFrame;

/* Map of Source to Memory+webContents
 * "id" => {
 *  "memory": bla,
 *  "region": bla2,
 *  "data": bla3,
 *  "listeners" => [1,2,...]
 * }
 */
let mapSourceIdToSource = new Map();
let mapSourceIdToName = new Map();
let mapSourceNameToId = new Map();
let mapSourceIdToBufferName = new Map();

let frameSubscriptionInitialized = false;

function generateUniqueSharedMemoryName(p_name) {
  // This has a very low chance of giving us the exact same string.
  let uuid = (Math.random() * 16777216).toString(16) + "-" + (Math.random() * 16777216).toString(16) + "-" + (Math.random() * 16777216).toString(16) + "-" + (Math.random() * 16777216).toString(16);
  return ("slobs" + process.pid.toString(16) + "-" + p_name + "-" + uuid);
}

function listenerFrameCallback(frameInfo) {
  console.log("LISTENER CALLBACK", frameInfo);

  let sourceId = mapSourceNameToId.get(frameInfo.name);
  if (sourceId === undefined) {
    console.error("listenerMain: Source", frameInfo.name, "is not being listened to.");
    return;
  }

  let entry = mapSourceIdToSource.get(sourceId);

  // Test if we need to reacquire the buffer (too small)
  if ((entry.data == null) || (entry.data.size < frameInfo.frame.byteLength)) { // Reacquire buffer
    // Header + 2x Content (Front/Back Buffer)
    let bufferName = generateUniqueSharedMemoryName(frameInfo.name);
    let bufferSize = SourceFrame.getFullSize(frameInfo.frame.byteLength);

    mapSourceIdToBufferName.set(sourceId, bufferName);

    try {
      let newMemory = new boost.interprocess.shared_memory(bufferName, bufferSize, boost.interprocess.shared_memory_flags.write + boost.interprocess.shared_memory_flags.create);
      let newRegion = new boost.interprocess.mapped_region(newMemory);
      let newData = new SourceFrame(newRegion.buffer(), frameInfo.frame.byteLength);

      // Initialize data
      newData.id = sourceId;
      newData.width = parseInt(frameInfo.width);
      newData.height = parseInt(frameInfo.height);
      switch (frameInfo.format) {
        case "VIDEO_FORMAT_RGBA":
          newData.format = 1;
          break;
        default:
          newData.format = 0; // Should be using a FourCharacterCode (FourCC) for this.
          break;
      }

      // Signal listeners
      entry.listeners.forEach(listener => {
        listener.send('listenerReacquire', sourceId, bufferName);
        listener.send('listenerResize', sourceId);
      });

      entry.data = newData;
      entry.region = newRegion;
      entry.memory = newMemory;
    } catch (exc) {
      console.error(exc);
      return;
    }
  }
  if ((entry.data.width !== frameInfo.width) || (entry.data.height !== frameInfo.height)) {
      // Signal listeners
      entry.listeners.forEach(listener => {
        listener.send('listenerResize', sourceId);
      });
  }

  // Copy to backbuffer
  entry.data.width = parseInt(frameInfo.width);
  entry.data.height = parseInt(frameInfo.height);
  entry.data.size = frameInfo.frame.byteLength;
  entry.data.backBuffer().set(new Uint8Array(frameInfo.frame));
  entry.data.flip();

  // Signal listeners
  entry.listeners.forEach(listener => {
    if (listener.isDestroyed()) {
      // Treat a destroyed window as if it unregistered
      frameUnregister(listener, sourceId);
    } else {
      listener.send('listenerFlip', sourceId);
    }
  });
}

ipcMain.on('listenerRegister', (event, id, name) => {
  // if (!frameSubscriptionInitialized) {
  //   // Register the callback before subscribing to any frames
  //   obs.OBS_content_initializeSubscribing(listenerFrameCallback);
  //   frameSubscriptionInitialized = true;
  // }

  // if (!mapSourceIdToSource.has(id)) {
  //   mapSourceIdToSource.set(id, {
  //     memory: null,
  //     region: null,
  //     data: null,
  //     listeners: new Set()
  //   });
  //   mapSourceIdToName.set(id, name);
  //   mapSourceNameToId.set(name, id);
  //   // Only register once.
  //   obs.OBS_content_subscribeToSource(name);
  // } else {
  //   // New subscribers need to be told where to find the source
  //   let bufferName = mapSourceIdToBufferName.get(id);
  //   event.sender.send('listenerReacquire', id, bufferName);
  //   event.sender.send('listenerResize', id);
  // }

  // mapSourceIdToSource.get(id).listeners.add(event.sender);
});

function frameUnregister(listener, id) {
  // if (mapSourceIdToSource.has(id)) {
  //   mapSourceIdToSource.get(id).listeners.delete(listener);
  //   if (mapSourceIdToSource.get(id).listeners.size === 0) {
  //     obs.OBS_content_unsubscribeFromSource(mapSourceIdToName.get(id));

  //     // No listeners? Then we can safely remove it.
  //     mapSourceNameToId.delete(mapSourceIdToName.get(id));
  //     mapSourceIdToName.delete(id);
  //     mapSourceIdToSource.delete(id);
  //   }
  // }
}

ipcMain.on('listenerUnregister', (event, id) => {
  frameUnregister(event.sender, id);
});