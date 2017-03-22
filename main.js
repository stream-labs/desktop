const pjson = require('./package.json');

if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
}

let obs;

if (process.env.NODE_ENV === 'production') {
  // OBS is loaded from outside the ASAR in production
  obs = require('../../node-obs');
} else {
  obs = require('./node-obs');
}

const { app, BrowserWindow, ipcMain } = require('electron');
const _ = require('lodash');

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


// Handle streaming of video over TCP socket
const net = require('net');
const path = require('path');
const SourceFrameHeader = require('./bundles/main_helpers.js').SourceFrameHeader;

let subscribedSources = [];
let socketPath = '';
if (process.platform === 'win32') {
  socketPath = path.join('\\\\?', 'pipe', 'slobs', process.pid.toString(), 'sourceTransfer')
} else {
    var fs = require('fs');
    if (!fs.existsSync(path.join('/tmp/slobs', process.pid.toString()))){
      fs.mkdirSync(path.join('/tmp/slobs', process.pid.toString()));
  }
  socketPath = path.join('/tmp/slobs', process.pid.toString(), 'sourceTransfer')
}

//@desc getSocketPath
// Call this synchronously (using IPC) from a Renderer to get the socket to connect to.
ipcMain.on('getSocketPath', (event, data) => {
  event.returnValue = socketPath;
});

ipcMain.on('subscribeToSource', (event, data) => {
  subscribedSources.push(data);
});


net.createServer(function(sock) {
  function sendFrames() {
    _.each(subscribedSources, source => {
      let frameInfo = obs.OBS_content_getSourceFrame(source.name);

      let frame = new Uint8Array(frameInfo.frame);
      let header = new SourceFrameHeader();

      header.id = source.id;
      header.width = parseInt(frameInfo.width);
      header.height = parseInt(frameInfo.height);
      header.frameLength = frame.length;

      if (frameInfo.format === 'VIDEO_FORMAT_I420') {
        header.format = 0;
      } else {
        header.format = 1;
      }

      sock.write(Buffer.from(header.buffer.buffer));

      // Write the actual frame data
      sock.write(Buffer.from(frame.buffer));
    });


    setTimeout(sendFrames, 33);
  }

  sendFrames();
}).listen(socketPath);
