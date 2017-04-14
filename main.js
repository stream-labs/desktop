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
const obs = require(process.env.NODE_ENV !== 'production' ? './node-obs' : '../../node-obs');

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

// Windows
let mainWindow;
let childWindow;

// Somewhat annoyingly, this is needed so that the child window
// can differentiate between a user closing it vs the app
// closing the windows before exit.
let appExiting = false;

const indexUrl = 'file://' + __dirname + '/index.html';

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    show: false
  });

  mainWindow.setMenu(null);

  mainWindow.loadURL(indexUrl);

  mainWindow.on('close', e => {
    if (!appExiting) {
      appExiting = true;
      mainWindow.send('shutdown');
      e.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    app.quit();
  });

  // Pre-initialize the child window
  childWindow = new BrowserWindow({
    show: false
  });

  childWindow.setMenu(null);

  // The child window is never closed, it just hides in the
  // background until it is needed.
  childWindow.on('close', e => {
    if (!appExiting) {
      childWindow.send('closeWindow');

      // Prevent the window from actually closing
      e.preventDefault();
    }
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

  // electron ipc doesn't like returning undefined, so
  // we return null instead.
  event.returnValue = retVal || null;
});

// Used for guaranteeing unique ids for objects in the vuex store
ipcMain.on('getUniqueId', event => {
  event.returnValue = _.uniqueId();
});
