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
const { app, BrowserWindow, ipcMain, session, crashReporter, dialog, webContents } = require('electron');
const fs = require('fs');
const bootstrap = require('./updater/bootstrap.js');
const uuid = require('uuid/v4');
const rimraf = require('rimraf');
const path = require('path');
const semver = require('semver');
const windowStateKeeper = require('electron-window-state');
const obs = require('obs-studio-node');

if (process.argv.includes('--clearCacheDir')) {
  rimraf.sync(app.getPath('userData'));
}

/* Determine the current release channel we're
 * on based on name. The channel will always be
 * the premajor identifier, if it exists.
 * Otherwise, default to latest. */
const releaseChannel = (() => {
  const components = semver.prerelease(pjson.version);

  if (components) return components[0];
  return 'latest';
})();

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

function startApp() {
  const isDevMode = (process.env.NODE_ENV !== 'production') && (process.env.NODE_ENV !== 'test');

  { // Initialize obs-studio-server
    // Set up environment variables for IPC.
    process.env.SLOBS_IPC_PATH = "slobs-".concat(uuid());
    process.env.SLOBS_IPC_USERDATA = app.getPath('userData');
    // Host a new IPC Server and connect to it.
    obs.IPC.ConnectOrHost(process.env.SLOBS_IPC_PATH);
    obs.NodeObs.SetWorkingDirectory(path.join(
      app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
      'node_modules',
      'obs-studio-node')
    );
  }

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
      submitURL:
        'https://streamlabs.sp.backtrace.io:6098/post?' +
        'format=minidump&' +
        'token=e3f92ff3be69381afe2718f94c56da4644567935cc52dec601cf82b3f52a06ce',
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
}

// We use a special cache directory for running tests
if (process.env.SLOBS_CACHE_DIR) {
  app.setPath('appData', process.env.SLOBS_CACHE_DIR);
}
app.setPath('userData', path.join(app.getPath('appData'), 'slobs-client'));

app.setAsDefaultProtocolClient('slobs');

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', (event, argv) => {
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
} else {
  app.exit();
}


app.on('ready', () => {
  if ((process.env.NODE_ENV === 'production') || process.env.SLOBS_FORCE_AUTO_UPDATE) {
    const updateInfo = {
      baseUrl: 'https://d1g6eog1uhe0xm.cloudfront.net',
      version: pjson.version,
      exec: process.argv,
      cwd: process.cwd(),
      waitPids: [ process.pid ],
      appDir: path.dirname(app.getPath('exe')),
      tempDir: path.join(app.getPath('temp'), 'slobs-updater'),
      cacheDir: app.getPath('userData'),
      versionFileName: `${releaseChannel}.json`
    };

    console.log(updateInfo);
    bootstrap(updateInfo).then((updating) => {
      if (updating) {
        console.log('Closing for update...');
        app.exit();
      } else {
        startApp();
      }
    });
  } else {
    startApp();
  }
});

app.on('quit', (e, exitCode) => {
  obs.IPC.disconnect();
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

ipcMain.on('restartApp', () => {
  app.relaunch();
  // Closing the main window starts the shut down sequence
  mainWindow.close();
});

ipcMain.on('streamlabels-writeFile', (e, info) => {
  fs.writeFile(info.path, info.data, err => {
    if (err) {
      console.log('Streamlabels: Error writing file', err);
    }
  });
});

ipcMain.on('webContents-preventNavigation', (e, id) => {
  webContents.fromId(id).on('will-navigate', e => {
    e.preventDefault();
  });
});

ipcMain.on('getMainWindowWebContentsId', e => {
  e.returnValue = mainWindow.webContents.id;
});

ipcMain.on('requestPerformanceStats', e => {
  const stats = app.getAppMetrics();
  e.sender.send('performanceStatsResponse', stats);
});
