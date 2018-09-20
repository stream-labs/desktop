'use strict';

////////////////////////////////////////////////////////////////////////////////
// Set Up Environment Variables
////////////////////////////////////////////////////////////////////////////////
const pjson = require('./package.json');
if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
}
if (pjson.name === 'slobs-client-preview') {
  process.env.SLOBS_PREVIEW = true;
}
if (pjson.name === 'slobs-client-ipc') {
  process.env.SLOBS_IPC = true;
}
process.env.SLOBS_VERSION = pjson.version;

////////////////////////////////////////////////////////////////////////////////
// Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const { app, BrowserWindow, ipcMain, session, crashReporter, dialog } = require('electron');
const fs = require('fs');
const { Updater } = require('./updater/Updater.js');
const uuid = require('uuid/v4');
const rimraf = require('rimraf');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

app.disableHardwareAcceleration();

if (process.argv.includes('--clearCacheDir')) {
  rimraf.sync(app.getPath('userData'));
}

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

function log(...args) {
  if (!process.env.SLOBS_DISABLE_MAIN_LOGGING) {
    console.log(...args);
  }
}

// Windows
let mainWindow;
let childWindow;

// Somewhat annoyingly, this is needed so that the child window
// can differentiate between a user closing it vs the app
// closing the windows before exit.
let allowMainWindowClose = false;
let shutdownStarted = false;
let appShutdownTimeout;

global.indexUrl = 'file://' + __dirname + '/index.html';


function openDevTools() {
  childWindow.webContents.openDevTools({ mode: 'undocked' });
  mainWindow.webContents.openDevTools({ mode: 'undocked' });
}

// Lazy require OBS
let _obs;

function getObs() {
  if (!_obs) {
    _obs = require('obs-studio-node').NodeObs;
  }

  return _obs;
}


function startApp() {
  const isDevMode = (process.env.NODE_ENV !== 'production') && (process.env.NODE_ENV !== 'test');

  const bt = require('backtrace-node');

  function handleFinishedReport() {
    dialog.showErrorBox(`Unhandled Exception`,
    'An unexpected error occured and the application must be shut down.\n' +
    'Information concerning this occasion has been sent for debugging purposes.\n' +
    'Sorry for the inconvenience and thanks for your patience as we work out the bugs!\n' +
    'Please restart the application.');

    if (app) {
      app.quit();
    }
  }

  function handleUnhandledException(err) {
    bt.report(err, {}, handleFinishedReport);
  }

  if (pjson.env === 'production') {
    bt.initialize({
      disableGlobalHandler: true,
      endpoint: 'https://streamlabs.sp.backtrace.io:6098',
      token: 'e3f92ff3be69381afe2718f94c56da4644567935cc52dec601cf82b3f52a06ce',
      attributes: {
        version: pjson.version,
        processType: 'main'
      }
    });

    process.on('uncaughtException', handleUnhandledException);

    crashReporter.start({
      productName: 'streamlabs-obs',
      companyName: 'streamlabs',
      ignoreSystemCrashHandler: true,
      submitURL:
        'https://sentry.io/api/1283430/minidump/' +
        '?sentry_key=01fc20f909124c8499b4972e9a5253f2',
      extra: {
        version: pjson.version,
        processType: 'main'
      }
    });
  }

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1600,
    defaultHeight: 1000
  });

  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    show: false,
    frame: false,
    title: 'Streamlabs OBS',
  });

  mainWindowState.manage(mainWindow);

  mainWindow.setMenu(null);

  // wait until devtools will be opened and load app into window
  // it allows to start application with clean cache
  // and handle breakpoints on startup
  const LOAD_DELAY = 2000;
  setTimeout(() => {
    mainWindow.loadURL(`${global.indexUrl}?windowId=main`);
  }, isDevMode ? LOAD_DELAY : 0);

  mainWindow.on('close', e => {
    if (!shutdownStarted) {
      shutdownStarted = true;
      childWindow.destroy();
      mainWindow.send('shutdown');

      // We give the main window 10 seconds to acknowledge a request
      // to shut down.  Otherwise, we just close it.
      appShutdownTimeout = setTimeout(() => {
        allowMainWindowClose = true;
        if (!mainWindow.isDestroyed()) mainWindow.close();
      }, 10 * 1000);
    }

    if (!allowMainWindowClose) e.preventDefault();
  });

  ipcMain.on('acknowledgeShutdown', () => {
    if (appShutdownTimeout) clearTimeout(appShutdownTimeout);
  });

  ipcMain.on('shutdownComplete', () => {
    allowMainWindowClose = true;
    mainWindow.close();
  });

  // Initialize the keylistener
  require('node-libuiohook').startHook();

  mainWindow.on('closed', () => {
    require('node-libuiohook').stopHook();
    session.defaultSession.flushStorageData();
    getObs().OBS_service_removeCallback();
    getObs().OBS_API_destroyOBS_API();
    getObs().IPC.disconnect();
    app.quit();
  });

  // Pre-initialize the child window
  childWindow = new BrowserWindow({
    show: false,
    frame: false
  });

  childWindow.setMenu(null);

  // The child window is never closed, it just hides in the
  // background until it is needed.
  childWindow.on('close', e => {
    if (!shutdownStarted) {
      childWindow.send('closeWindow');

      // Prevent the window from actually closing
      e.preventDefault();
    }
  });


  // simple messaging system for services between windows
  // WARNING! the child window use synchronous requests and will be frozen
  // until main window asynchronous response
  const requests = { };

  function sendRequest(request, event = null) {
    mainWindow.webContents.send('services-request', request);
    if (!event) return;
    requests[request.id] = Object.assign({}, request, { event });
  }

  // use this function to call some service method from the main process
  function callService(resource, method, ...args) {
    sendRequest({
      jsonrpc: '2.0',
      method,
      params: {
        resource,
        args
      }
    });
  }

  ipcMain.on('services-ready', () => {
    callService('AppService', 'setArgv', process.argv);
    childWindow.loadURL(`${global.indexUrl}?windowId=child`);
  });

  ipcMain.on('services-request', (event, payload) => {
    sendRequest(payload, event);
  });

  ipcMain.on('services-response', (event, response) => {
    if (!requests[response.id]) return;
    requests[response.id].event.returnValue = response;
    delete requests[response.id];
  });

  ipcMain.on('services-message', (event, payload) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (window.id === mainWindow.id || window.isDestroyed()) return;
      window.webContents.send('services-message', payload);
    });
  });


  if (isDevMode) {
    require('devtron').install();

    // Vue dev tools appears to cause strange non-deterministic
    // interference with certain NodeJS APIs, expecially asynchronous
    // IO from the renderer process.  Enable at your own risk.

    // const devtoolsInstaller = require('electron-devtools-installer');
    // devtoolsInstaller.default(devtoolsInstaller.VUEJS_DEVTOOLS);

    // setTimeout(() => {
    //   openDevTools();
    // }, 10 * 1000);

  }

  getObs().IPC.ConnectOrHost("slobs" + uuid());
  // Initialize various OBS services
  getObs().SetWorkingDirectory(
    path.join(app.getAppPath().replace('app.asar', 'app.asar.unpacked') +
              '/node_modules/obs-studio-node'));

  getObs().OBS_API_initAPI('en-US', app.getPath('userData'));
}

// We use a special cache directory for running tests
if (process.env.SLOBS_CACHE_DIR) {
  app.setPath('appData', process.env.SLOBS_CACHE_DIR);
}
app.setPath('userData', path.join(app.getPath('appData'), 'slobs-client'));

app.setAsDefaultProtocolClient('slobs');

// This ensures that only one copy of our app can run at once.
const shouldQuit = app.makeSingleInstance(argv => {
  // Check for protocol links in the argv of the other process
  argv.forEach(arg => {
    if (arg.match(/^slobs:\/\//)) {
      mainWindow.send('protocolLink', arg);
    }
  });

  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  }
});

if (shouldQuit) {
  app.exit();
}

app.on('ready', () => {
  // if ((process.env.NODE_ENV === 'production') || process.env.SLOBS_FORCE_AUTO_UPDATE) {
  //   (new Updater(startApp)).run();
  // } else {
    startApp();
  // }
});

ipcMain.on('openDevTools', () => {
  openDevTools();
});

ipcMain.on('window-showChildWindow', (event, windowOptions) => {
  if (windowOptions.size.width && windowOptions.size.height) {
    // Center the child window on the main window

    // For some unknown reason, electron sometimes gets into a
    // weird state where this will always fail.  Instead, we
    // should recover by simply setting the size and forgetting
    // about the bounds.
    try {
      const bounds = mainWindow.getBounds();
      const childX = (bounds.x + (bounds.width / 2)) - (windowOptions.size.width / 2);
      const childY = (bounds.y + (bounds.height / 2)) - (windowOptions.size.height / 2);

      childWindow.show();
      childWindow.restore();
      childWindow.setMinimumSize(windowOptions.size.width, windowOptions.size.height);

      if (windowOptions.center) {
        childWindow.setBounds({
          x: Math.floor(childX),
          y: Math.floor(childY),
          width: windowOptions.size.width,
          height: windowOptions.size.height
        });
      }
    } catch (err) {
      log('Recovering from error:', err);

      childWindow.setMinimumSize(windowOptions.size.width, windowOptions.size.height);
      childWindow.setSize(windowOptions.size.width, windowOptions.size.height);
      childWindow.center();
    }

    childWindow.focus();
  }

});


ipcMain.on('window-closeChildWindow', (event) => {
  // never close the child window, hide it instead
  childWindow.hide();
});


ipcMain.on('window-focusMain', () => {
  mainWindow.focus();
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
    log('Registered vuex stores: ', Object.keys(registeredStores));

    // Make sure we unregister is when it is closed
    win.on('closed', () => {
      delete registeredStores[windowId];
      log('Registered vuex stores: ', Object.keys(registeredStores));
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
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  if (senderWindow && !senderWindow.isDestroyed()) {
    const windowId = senderWindow.id;

    Object.keys(registeredStores).filter(id => id !== windowId.toString()).forEach(id => {
      const win = registeredStores[id];
      if (!win.isDestroyed()) win.webContents.send('vuex-mutation', mutation);
    });
  }
});


// Virtual node OBS calls:
//
// These are methods that appear upstream to be OBS
// API calls, but are actually Javascript functions.
// These should be used sparingly, and are used to
// ensure atomic operation of a handful of calls.
const nodeObsVirtualMethods = {

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

  if (shouldLog) log('OBS API CALL', data);

  const mappedArgs = data.args.map(arg => {
    const isCallbackPlaceholder = (typeof arg === 'object') && arg && arg.__obsCallback;

    if (isCallbackPlaceholder) {
      return (...args) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('obs-apiCallback', {
            id: arg.id,
            args
          });
        }
      };
    }

    return arg;
  });

  if (nodeObsVirtualMethods[data.method]) {
    retVal = nodeObsVirtualMethods[data.method].apply(null, mappedArgs);
  } else {
    retVal = getObs()[data.method](...mappedArgs);
  }

  if (shouldLog) log('OBS RETURN VALUE', retVal);

  // electron ipc doesn't like returning undefined, so
  // we return null instead.
  if (retVal == null) {
    retVal = null;
  }

  event.returnValue = retVal;
});

ipcMain.on('restartApp', () => {
  app.relaunch();
  // Closing the main window starts the shut down sequence
  mainWindow.close();
});

ipcMain.on('requestSourceAttributes', (e, names) => {
  const sizes = require('obs-studio-node').getSourcesSize(names);

  e.sender.send('notifySourceAttributes', sizes);
});

ipcMain.on('requestPerformanceStatistics', (e) => {
  const stats = getObs().OBS_API_getPerformanceStatistics();

  e.sender.send('notifyPerformanceStatistics', stats);
});

ipcMain.on('streamlabels-writeFile', (e, info) => {
  fs.writeFile(info.path, info.data, err => {
    if (err) {
      console.log('Streamlabels: Error writing file', err);
    }
  });
});
