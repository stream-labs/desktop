'use strict';

////////////////////////////////////////////////////////////////////////////////
// Set Up Environment Variables
////////////////////////////////////////////////////////////////////////////////
const pjson = require('./package.json');
if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
}
process.env.SLOBS_VERSION = pjson.version;

////////////////////////////////////////////////////////////////////////////////
// Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const inAsar = process.mainModule.filename.indexOf('app.asar') !== -1;
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const obs = require(inAsar ? '../../node-obs' : './node-obs');
const { Updater } = require('./updater/Updater.js');

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

// Windows
let mainWindow;
let childWindow;

// This file determines whether we start up in SLOBS-mode or
// OBS-mode, so we need to load it on app startup.
function loadStartupConfig() {
  const configLocation = path.join(app.getPath('userData'), 'startup.json');

  if (fs.existsSync(configLocation)) {
    return JSON.parse(fs.readFileSync(configLocation));
  }

  return null;
}

// Somewhat annoyingly, this is needed so that the child window
// can differentiate between a user closing it vs the app
// closing the windows before exit.
let appExiting = false;

const indexUrl = 'file://' + __dirname + '/index.html';

function startApp() {
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

  const startupConfig = loadStartupConfig();

  if (startupConfig && startupConfig.obsMode) {
    obs.OBS_API_setOBS_currentProfile(startupConfig.profile);
    obs.OBS_API_setOBS_currentSceneCollection(startupConfig.sceneCollection);
    obs.OBS_API_setPathConfigDirectory('');
  } else {
    obs.OBS_API_setPathConfigDirectory(app.getPath('userData'));
  }

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
}

// This ensures that only one copy of our app can run at once.
const shouldQuit = app.makeSingleInstance(() => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.quit();
}

app.on('ready', () => {
  if ((process.env.NODE_ENV === 'production') || process.env.SLOBS_FORCE_AUTO_UPDATE) {
    (new Updater(startApp)).run();
  } else {
    startApp();
  }
});

ipcMain.on('window-showChildWindow', (event, data) => {
  if (data.windowOptions.width && data.windowOptions.height) {
    childWindow.setSize(data.windowOptions.width, data.windowOptions.height);
    childWindow.center();
  }

  // The child window will show itself when rendered
  childWindow.send('window-setContents', data.startupOptions);
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



// Handle service initialization
const servicesInitialized = new Set();

ipcMain.on('services-shouldInit', (event, service) => {
  event.returnValue = !servicesInitialized.has(service);
  servicesInitialized.add(service);
});


// Virtual node OBS calls:
//
// These are methods that appear upstream to be OBS
// API calls, but are actually Javascript functions.
// These should be used sparingly, and are used to
// ensure atomic operation of a handful of calls.
const nodeObsVirtualMethods = {

  // This needs to be done as a single IPC call, otherwise
  // there is visible judder in the display output.
  OBS_content_setSourcePositionAndScale(sceneName, sourceName, x, y, scaleX, scaleY) {
    obs.OBS_content_setSourcePosition(sceneName, sourceName, x, y);
    obs.OBS_content_setSourceScaling(sceneName, sourceName, scaleX, scaleY);
  },

  OBS_test_callbackProxy(num, cb) {
    setTimeout(() => {
      cb(num + 1);
    }, 5000);
  }

};

// These are called constantly and dirty up the logs.
// They can be commented out of this list on the rare
// occasional that they are useful in the log output.
const filteredObsApiMethods = [
  'OBS_content_getSourceSize',
  'OBS_content_getSourceFlags',
  'OBS_API_getPerformanceStatistics'
];

// Proxy node OBS calls
ipcMain.on('obs-apiCall', (event, data) => {
  let retVal;
  const shouldLog = !filteredObsApiMethods.includes(data.method);

  if (shouldLog) console.log('OBS API CALL', data);

  const mappedArgs = data.args.map(arg => {
    const isCallbackPlaceholder = (typeof arg === 'object') && arg && arg.__obsCallback;

    if (isCallbackPlaceholder) {
      return (...args) => {
        event.sender.send('obs-apiCallback', {
          id: arg.id,
          args
        });
      };
    }

    return arg;
  });

  if (nodeObsVirtualMethods[data.method]) {
    retVal = nodeObsVirtualMethods[data.method].apply(null, mappedArgs);
  } else {
    retVal = obs[data.method].apply(obs, mappedArgs);
  }

  if (shouldLog) console.log('OBS RETURN VALUE', retVal);

  // electron ipc doesn't like returning undefined, so
  // we return null instead.
  if (retVal == null) {
    retVal = null;
  }

  event.returnValue = retVal;
});

// Used for guaranteeing unique ids for objects in the vuex store
ipcMain.on('getUniqueId', event => {
  event.returnValue = _.uniqueId();
});

ipcMain.on('restartApp', () => {
  app.relaunch();
  // Closing the main window starts the shut down sequence
  mainWindow.close();
});
