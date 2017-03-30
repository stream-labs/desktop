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
const boost = require('node-boost');
const _ = require('lodash');
const obs = require(process.env.NODE_ENV !== 'production' ? './node-obs' : '../../node-obs');

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

// Windows
let mainWindow;
let childWindow;

const indexUrl = 'file://' + __dirname + '/index.html';

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false
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

function generateUniqueSharedMemoryName(p_name) {
  // This has a very low chance of giving us the exact same string.
  let uuid = (Math.random() * 16777216).toString(16) + "-" + (Math.random() * 16777216).toString(16) + "-" + (Math.random() * 16777216).toString(16) + "-" + (Math.random() * 16777216).toString(16);
  return ("slobs" + process.pid.toString(16) + "-" + p_name + "-" + uuid);
}

function listenerFrameCallback(sourceName, frameInfo) {
  //let sourceId = mapSourceNameToId.get(frameInfo.name); // Requires https://github.com/twitchalerts/node-obs/pull/16
  let sourceId = mapSourceNameToId.get(sourceName);
  if (sourceId === undefined) {
    console.error("listenerMain: Source", frameInfo.name, "is not being listened to.");
    return;
  }

  let entry = mapSourceIdToSource.get(sourceId);

  // Test if we need to reacquire the buffer (too small)
  let shouldReacquire = false;
  if ((entry.data == null) || (entry.data.size < frameInfo.frame.length)) {
    shouldReacquire = true;
  }

  if (shouldReacquire) { // Reacquire buffer
    // Header + 2x Content (Front/Back Buffer)
    let bufferName = generateUniqueSharedMemoryName(frameInfo.name);
    let bufferSize = SourceFrame.getFullSize(frameInfo.frame.byteLength);

    try {
      let newMemory = new boost.interprocess.shared_memory(bufferName, bufferSize, boost.interprocess.shared_memory_flags.Write + boost.interprocess.shared_memory_flags.Create);
      let newRegion = new boost.interprocess.mapped_region(newMemory);
      let newData = new SourceFrame(newRegion.buffer(), frameInfo.frame.byteLength);

      // Initialize data
      newData.id = sourceId;
      newData.width = frameInfo.width;
      newData.height = frameInfo.height;
      switch (frameInfo.format) {
        case "VIDEO_FORMAT_RGBA":
          newData.format = 1;
          break;
        default:
          newData.format = 0; // Should be using a FourCharacterCode (FourCC) for this.
          break;
      }

      // Signal listeners
      entry.listeners.forEach((value, key, map) => {
        value.send('listenerReacquire', sourceId, bufferName);
      });

      entry.data = newData;
      entry.region = newRegion;
      entry.memory = newMemory;
    } catch (exc) {
      console.error(exc);
      return;
    }
  }

  // Copy to backbuffer
  entry.data.width = frameInfo.width;
  entry.data.height = frameInfo.height;
  entry.data.backBuffer().set(frameInfo.frame);
  entry.data.flip();

  // Signal listeners
  entry.listeners.forEach((value, key, map) => {
    value.send('listenerFlip', sourceId);
  });
}

ipcMain.on('listenerRegister', (p_event, id, name) => {
  // console.log("listenerRegister:", p_id, p_name);

  if (!mapSourceIdToSource.has(id)) {
    mapSourceIdToSource.set(id, {
      memory: null,
      region: null,
      data: null,
      listeners: new Set()
    });
    mapSourceIdToName.set(id, name);
    mapSourceNameToId.set(name, id);
    // Only register once.
    obs.OBS_content_subscribeSourceFrames(name, (frameInfo) => {
      listenerFrameCallback(name, frameInfo);
    });
  }
  mapSourceIdToSource.get(id).listeners.add(p_event.sender);
});

ipcMain.on('listenerUnregister', (event, id) => {
  // console.log("listenerUnregister:", p_id, g_IdToNameMap.get(p_id));
  if (mapSourceIdToSource.has(id)) {
    mapSourceIdToSource.get(id).listeners.delete(event.sender);
    if (mapSourceIdToSource.get(id).listeners.size === 0) {
      // No listeners? Then we can safely remove it.
      mapSourceNameToId.delete(mapSourceIdToName.get(id));
      mapSourceIdToName.delete(id);
      mapSourceIdToSource.delete(id);
    }
  }
});