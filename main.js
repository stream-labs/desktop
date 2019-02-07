'use strict';

////////////////////////////////////////////////////////////////////////////////
// Set Up Environment Variables
////////////////////////////////////////////////////////////////////////////////
const pjson = require('./package.json');
if (pjson.env === 'production') {
  process.env.NODE_ENV = 'production';
}
if (pjson.name === 'n-air-app-preview') {
  process.env.NAIR_PREVIEW = true;
}
if (pjson.name === 'n-air-app-ipc') {
  process.env.NAIR_IPC = true;
}
process.env.NAIR_VERSION = pjson.version;
process.env.NAIR_PRODUCT_NAME = pjson.buildProductName;

if (!process.env.NAIR_LICENSE_API_KEY && pjson.getlicensenair_key) {
  process.env.NAIR_LICENSE_API_KEY = pjson.getlicensenair_key;
}

////////////////////////////////////////////////////////////////////////////////
// Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const { app, BrowserWindow, ipcMain, session, crashReporter, dialog } = require('electron');
const electron = require('electron');
const fs = require('fs');
const { Updater } = require('./updater/Updater.js');
const uuid = require('uuid/v4');
const rimraf = require('rimraf');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

app.disableHardwareAcceleration();

////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////

function log(...args) {
  if (!process.env.NAIR_DISABLE_MAIN_LOGGING) {
    console.log(...args);
  }
}

if (process.argv.includes('--clearCacheDir')) {
  // __installer.exe は electron-updater 差分アップデートの比較元になるので消してはいけない
  const rmPath = path.join(app.getPath('appData'), 'n-air-app', '!(__installer.exe)');
  log('clear cache directory!: ', rmPath);
  rimraf.sync(rmPath);
}

// Windows
let mainWindow;
let childWindow;
let childWindowIsReadyToShow = false;

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
      endpoint: 'https://n-air-app.sp.backtrace.io:8443',
      token: '66abc2eda8a8ead580b825dd034d9b4f9da4d54eeb312bf8ce713571e1b1d35f',
      attributes: {
        version: pjson.version,
        processType: 'main'
      }
    });

    process.on('uncaughtException', handleUnhandledException);

    crashReporter.start({
      productName: 'n-air-app',
      companyName: 'n-air-app',
      submitURL:
        'https://n-air-app.sp.backtrace.io:8443/post?' +
        'format=minidump&' +
        'token=66abc2eda8a8ead580b825dd034d9b4f9da4d54eeb312bf8ce713571e1b1d35f',
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

  const mainWindowIsVisible = electron.screen.getAllDisplays().some(display => (
    display.workArea.x < mainWindowState.x + mainWindowState.width &&
    mainWindowState.x < display.workArea.x + display.workArea.width &&
    display.workArea.y < mainWindowState.y &&
    mainWindowState.y < display.workArea.y + display.workArea.height
  ));

  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: false,
    frame: false,
    title: process.env.NAIR_PRODUCT_NAME,
    ...(mainWindowIsVisible ? {
      x: mainWindowState.x,
      y: mainWindowState.y
    } : {})
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
    getObs().OBS_API_destroyOBS_API();
    app.quit();
  });

  // Pre-initialize the child window
  childWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
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

  ipcMain.on('window-childWindowIsReadyToShow', () => {
    childWindowIsReadyToShow = true;
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

  // Initialize various OBS services
  getObs().SetWorkingDirectory(
    path.join(app.getAppPath().replace('app.asar', 'app.asar.unpacked') +
              '/node_modules/obs-studio-node'));

  getObs().OBS_API_initAPI('en-US', app.getPath('userData'));
}

// We use a special cache directory for running tests
if (process.env.NAIR_CACHE_DIR) {
  app.setPath('appData', process.env.NAIR_CACHE_DIR);
}
app.setPath('userData', path.join(app.getPath('appData'), 'n-air-app'));

app.setAsDefaultProtocolClient('nair');

// This ensures that only one copy of our app can run at once.
const shouldQuit = app.makeSingleInstance(argv => {
  // Check for protocol links in the argv of the other process
  argv.forEach(arg => {
    if (arg.match(/^nair:\/\//)) {
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

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    log(`copyFile: ${src} not found!`);
    return;
  }

  const stat = fs.statSync(src);

  if (fs.existsSync(dest)) {
    const cache = fs.statSync(dest);
    if (stat.size === cache.size && stat.mtime === cache.mtime) {
      log('copyFile: the same file exists. skip.');
      return;
    }
  }

  try {
    fs.copyFileSync(src, dest);
    fs.utimesSync(dest, stat.atime, stat.mtime);
  } catch (e) {
    log(`copyFile Error: ${e.name}: ${e.message}`);
  }
}

app.on('ready', () => {
  if ((process.env.NODE_ENV === 'production') || process.env.NAIR_FORCE_AUTO_UPDATE) {

    // copy the original installer file so that it can be found for differential updating
    const nsisInstallerFileName = '__installer.exe';
    const installerPath = path.join(app.getPath('appData'), process.env.NAIR_PRODUCT_NAME, nsisInstallerFileName);
    const cachePath = path.join(app.getPath('userData'), nsisInstallerFileName);
    log(`copying ${installerPath} to ${cachePath}...`);
    copyFile(installerPath, cachePath);

    (new Updater(startApp)).run();
  } else {
    startApp();
  }
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
      const mainWindowBounds = mainWindow.getBounds();
      const mainWindowDisplay = electron.screen.getDisplayMatching(mainWindowBounds);
      const targetWorkArea = mainWindowDisplay.workArea;

      const width = Math.min(windowOptions.size.width, targetWorkArea.width);
      const height = Math.min(windowOptions.size.height, targetWorkArea.height);

      childWindow.restore();
      childWindow.setMinimumSize(width, height);

      if (windowOptions.center) {
        const baseChildY = mainWindowBounds.y;
        const overflowsBottom = Math.max(0, baseChildY + height - targetWorkArea.y - targetWorkArea.height);
        const overflowsTop = Math.max(0, targetWorkArea.y - baseChildY);

        const baseChildX = (mainWindowBounds.x + (mainWindowBounds.width / 2)) - (width / 2);
        const overflowsRight = Math.max(0, baseChildX + width - targetWorkArea.x - targetWorkArea.width);
        const overflowsLeft = Math.max(0, targetWorkArea.x - baseChildX);

        const childX = baseChildX + overflowsLeft - overflowsRight;
        const childY = baseChildY + overflowsTop - overflowsBottom;

        childWindow.setBounds({
          x: Math.floor(childX),
          y: Math.floor(childY),
          width,
          height
        });
      }
    } catch (err) {
      log('Recovering from error:', err);

      const workAreaSize = electron.screen.getPrimaryDisplay().workAreaSize;
      const width = Math.min(windowOptions.size.width, workAreaSize.width);
      const height = Math.min(windowOptions.size.height, workAreaSize.height);

      childWindow.setMinimumSize(width, height);
      childWindow.setSize(width, height);
      childWindow.center();
    }

    childWindow.focus();
  }


  // show the child window when it will be ready
  new Promise(resolve => {
    if (childWindowIsReadyToShow) {
      resolve();
      return;
    }
    ipcMain.once('window-childWindowIsReadyToShow', () => resolve());
  }).then(() => {
    // The child window will show itself when rendered
    childWindow.send('window-setContents', windowOptions);
  });

});


ipcMain.on('window-closeChildWindow', (event) => {
  // never close the child window, hide it instead
  childWindow.hide();
});


ipcMain.on('window-focusMain', () => {
  mainWindow.focus();
});

function preventClose(e) {
  if (!shutdownStarted) {
    e.preventDefault();
  }
}

ipcMain.on('window-preventClose', (event, id) => {
  const window = BrowserWindow.fromId(id);
  window.addListener('close', preventClose);
});

ipcMain.on('window-allowClose', (event, id) => {
  const window = BrowserWindow.fromId(id);
  window.removeListener('close', preventClose);
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

// Used for guaranteeing unique ids for objects in the vuex store
ipcMain.on('getUniqueId', event => {
  event.returnValue = uuid();
});

ipcMain.on('restartApp', () => {
  // prevent unexpected cache clear
  const args = process.argv.slice(1).filter(x => x !== '--clearCacheDir');

  app.relaunch( {args} );
  // Closing the main window starts the shut down sequence
  mainWindow.close();
});

ipcMain.on('requestSourceAttributes', (e, names) => {
  const sizes = require('obs-studio-node').getSourcesSize(names);

  e.sender.send('notifySourceAttributes', sizes);
});
