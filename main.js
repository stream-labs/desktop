const appStartTime = Date.now();
let lastEventTime = 0;

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

const { Updater } = require('./updater/mac/Updater.js');

////////////////////////////////////////////////////////////////////////////////
// Modules and other Requires
////////////////////////////////////////////////////////////////////////////////
const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  crashReporter,
  dialog,
  webContents,
  desktopCapturer,
  MessageChannelMain,
} = require('electron');
const path = require('path');
const remote = require('@electron/remote/main');
const fs = require('fs');

// Game overlay is Windows only
let overlay;

// We use a special cache directory for running tests
if (process.env.SLOBS_CACHE_DIR) {
  app.setPath('appData', process.env.SLOBS_CACHE_DIR);
}

app.setPath('userData', path.join(app.getPath('appData'), 'slobs-client'));

if (process.argv.includes('--clearCacheDir')) {
  try {
    // This could block for a while, but should ensure that the crash handler
    // is no longer able to interfere with cache removal.
    fs.rmSync(app.getPath('userData'), {
      force: true,
      recursive: true,
      maxRetries: 5,
      retryDelay: 500,
    });
  } catch (e) {}
}

// This ensures that only one copy of our app can run at once.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

const bootstrap = require('./updater/build/bootstrap.js');
const bundleUpdater = require('./updater/build/bundle-updater.js');
const uuid = require('uuid/v4');
const semver = require('semver');
const windowStateKeeper = require('electron-window-state');
const pid = require('process').pid;

app.commandLine.appendSwitch('force-ui-direction', 'ltr');
app.commandLine.appendSwitch(
  'ignore-connections-limit',
  'streamlabs.com,youtube.com,twitch.tv,facebook.com,mixer.com',
);

process.env.IPC_UUID = `slobs-${uuid()}`;

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

// Windows
let workerWindow;
let mainWindow;
let childWindow;

const util = require('util');
const logFile = path.join(app.getPath('userData'), 'app.log');
const maxLogBytes = 131072;

// Truncate the log file if it is too long
if (fs.existsSync(logFile) && fs.statSync(logFile).size > maxLogBytes) {
  const content = fs.readFileSync(logFile);
  fs.writeFileSync(logFile, '[LOG TRUNCATED]\n');
  fs.writeFileSync(logFile, content.slice(content.length - maxLogBytes), { flag: 'a' });
}

ipcMain.on('logmsg', (e, msg) => {
  if (msg.level === 'error' && mainWindow && process.env.NODE_ENV !== 'production') {
    mainWindow.send('unhandledErrorState');
  }

  logFromRemote(msg.level, msg.sender, msg.message);
});

function logFromRemote(level, sender, msg) {
  msg.split('\n').forEach(line => {
    writeLogLine(`[${new Date().toISOString()}] [${level}] [${sender}] - ${line}`);
  });
}

const consoleLog = console.log;
console.log = (...args) => {
  if (!process.env.SLOBS_DISABLE_MAIN_LOGGING) {
    const serialized = args
      .map(arg => {
        if (typeof arg === 'string') return arg;

        return util.inspect(arg);
      })
      .join(' ');

    logFromRemote('info', 'electron-main', serialized);
  }
};

const lineBuffer = [];

function writeLogLine(line) {
  // Also print to stdout
  consoleLog(line);

  lineBuffer.push(`${line}\n`);
  flushNextLine();
}

let writeInProgress = false;

function flushNextLine() {
  if (lineBuffer.length === 0) return;
  if (writeInProgress) return;

  const nextLine = lineBuffer.shift();

  writeInProgress = true;

  fs.writeFile(logFile, nextLine, { flag: 'a' }, e => {
    writeInProgress = false;

    if (e) {
      consoleLog('Error writing to log file', e);
      return;
    }

    flushNextLine();
  });
}

const os = require('os');
const cpus = os.cpus();

// Source: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
function humanFileSize(bytes, si) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

console.log('=================================');
console.log('Streamlabs Desktop');
console.log(`Version: ${process.env.SLOBS_VERSION}`);
console.log(`OS: ${os.platform()} ${os.release()}`);
console.log(`Arch: ${process.arch}`);
console.log(`CPU: ${cpus[0].model}`);
console.log(`Cores: ${cpus.length}`);
console.log(`Memory: ${humanFileSize(os.totalmem(), false)}`);
console.log(`Free: ${humanFileSize(os.freemem(), false)}`);
console.log('=================================');

app.on('ready', () => {
  /* Load React DevTools in dev mode */
  if (process.env.NODE_ENV === 'development') {
    const reactDevToolsPath = path.join(__dirname, 'vendor', 'react-devtools');
    session.defaultSession
      .loadExtension(reactDevToolsPath, { allowFileAccess: true })
      .then(() => console.log('Installed React DevTools'))
      .catch(err => console.log('Error installing React DevTools', err));
  }

  // Detect when running from an unwritable location like a DMG image (will break updater)
  if (process.platform === 'darwin') {
    try {
      fs.accessSync(app.getPath('exe'), fs.constants.W_OK);
    } catch (e) {
      // This error code indicates a read only file system
      if (e.code === 'EROFS') {
        dialog.showErrorBox(
          'Streamlabs Desktop',
          'Please run Streamlabs Desktop from your Applications folder. Streamlabs Desktop cannot run directly from this disk image.',
        );
        app.exit();
      }
    }
  }

  // network logging is disabled by default
  if (!process.argv.includes('--network-logging')) return;

  // ignore fs requests
  const filter = { urls: ['https://*', 'http://*'] };

  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    console.log('HTTP REQUEST', details.method, details.url);
    callback(details);
  });

  session.defaultSession.webRequest.onErrorOccurred(filter, details => {
    console.log('HTTP REQUEST FAILED', details.method, details.url);
  });

  session.defaultSession.webRequest.onCompleted(filter, details => {
    console.log('HTTP REQUEST COMPLETED', details.method, details.url, details.statusCode);
  });
});

// Somewhat annoyingly, this is needed so that the main window
// can differentiate between a user closing it vs the app
// closing the windows before exit.
let allowMainWindowClose = false;
let shutdownStarted = false;
let appShutdownTimeout;

global.indexUrl = `file://${__dirname}/index.html`;

function openDevTools() {
  childWindow.webContents.openDevTools({ mode: 'detach' });
  mainWindow.webContents.openDevTools({ mode: 'detach' });
  workerWindow.webContents.openDevTools({ mode: 'detach' });
}

// TODO: Clean this up
// These windows are waiting for services to be ready
const waitingVuexStores = [];
let workerInitFinished = false;

async function startApp() {
  const crashHandler = require('crash-handler');
  const isDevMode = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  const crashHandlerLogPath = app.getPath('userData');

  if (process.platform === 'win32') {
    overlay = require('game_overlay');
  }

  await bundleUpdater(__dirname);

  crashHandler.startCrashHandler(
    app.getAppPath(),
    process.env.SLOBS_VERSION,
    isDevMode.toString(),
    crashHandlerLogPath,
    process.env.IPC_UUID,
  );
  crashHandler.registerProcess(pid, false);

  ipcMain.on('register-in-crash-handler', (event, arg) => {
    crashHandler.registerProcess(arg.pid, arg.critical);
  });

  ipcMain.on('unregister-in-crash-handler', (event, arg) => {
    crashHandler.unregisterProcess(arg.pid);
  });

  remote.initialize();

  const Raven = require('raven');

  function handleFinishedReport() {
    dialog.showErrorBox(
      'Something Went Wrong',
      'An unexpected error occured and Streamlabs Desktop must be shut down.\n' +
        'Please restart the application.',
    );

    app.exit();
  }

  if (pjson.env === 'production') {
    Raven.config(pjson.sentryFrontendDSN, {
      release: process.env.SLOBS_VERSION,
    }).install((err, initialErr, eventId) => {
      handleFinishedReport();
    });

    const submitURL = process.env.SLOBS_PREVIEW
      ? pjson.sentryBackendClientPreviewURL
      : pjson.sentryBackendClientURL;

    if (submitURL) {
      crashReporter.start({
        productName: 'streamlabs-obs',
        companyName: 'streamlabs',
        ignoreSystemCrashHandler: true,
        submitURL,
        extra: {
          processType: 'main',
        },
        globalExtra: {
          'sentry[release]': pjson.version,
          'sentry[user][ip_address]': '{{auto}}',
        },
      });
    }
  }

  workerWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  remote.enable(workerWindow.webContents);

  // setTimeout(() => {
  workerWindow.loadURL(`${global.indexUrl}?windowId=worker`);
  // }, 10 * 1000);

  if (process.env.SLOBS_PRODUCTION_DEBUG) {
    workerWindow.webContents.once('dom-ready', () => {
      workerWindow.webContents.openDevTools({ mode: 'detach' });
    });
  }

  // All renderers should use ipcRenderer.sendTo to send to communicate with
  // the worker.  This still gets proxied via the main process, but eventually
  // we will refactor this to not use electron IPC, which will make it much
  // more efficient.
  ipcMain.on('getWorkerWindowId', event => {
    if (workerWindow.isDestroyed()) {
      // prevent potential race-condition issues on app close
      // https://github.com/stream-labs/desktop/pull/4239
      return;
    }
    event.returnValue = workerWindow.webContents.id;
  });

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1600,
    defaultHeight: 1000,
  });

  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.isMaximized ? mainWindowState.displayBounds.x : mainWindowState.x,
    y: mainWindowState.isMaximized ? mainWindowState.displayBounds.y : mainWindowState.y,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    title: 'Streamlabs Desktop',
    backgroundColor: '#17242D',
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      contextIsolation: false,
    },
  });

  remote.enable(mainWindow.webContents);

  // setTimeout(() => {
  mainWindow.loadURL(`${global.indexUrl}?windowId=main`);
  // }, 5 * 1000)

  if (process.env.SLOBS_PRODUCTION_DEBUG) {
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });
  }

  mainWindowState.manage(mainWindow);

  mainWindow.removeMenu();

  mainWindow.on('close', e => {
    if (!shutdownStarted) {
      shutdownStarted = true;
      workerWindow.send('shutdown');

      // We give the worker window 10 seconds to acknowledge a request
      // to shut down.  Otherwise, we just close it.
      appShutdownTimeout = setTimeout(() => {
        allowMainWindowClose = true;
        if (!mainWindow.isDestroyed()) mainWindow.close();
        if (!workerWindow.isDestroyed()) workerWindow.close();
      }, 10 * 1000);
    }

    if (!allowMainWindowClose) e.preventDefault();
  });

  // prevent worker window to be closed before other windows
  // we need it to properly handle App.stop() in tests
  // since it tries to close all windows
  workerWindow.on('close', e => {
    if (!shutdownStarted) {
      e.preventDefault();
      mainWindow.close();
    }
  });

  // This needs to be explicitly handled on Mac
  app.on('before-quit', e => {
    if (!shutdownStarted) {
      e.preventDefault();
      mainWindow.close();
    }
  });

  ipcMain.on('acknowledgeShutdown', () => {
    if (appShutdownTimeout) clearTimeout(appShutdownTimeout);
  });

  ipcMain.on('shutdownComplete', () => {
    allowMainWindowClose = true;
    mainWindow.close();
    workerWindow.close();
  });

  workerWindow.on('closed', () => {
    session.defaultSession.flushStorageData();
    session.defaultSession.cookies.flushStore().then(() => {
      // Run updater if update available
      if (
        !process.argv.includes('--skip-update') &&
        (process.env.NODE_ENV === 'production' || process.env.SLOBS_FORCE_AUTO_UPDATE)
      ) {
        // Windows uses our custom update, Mac uses electron-updater
        if (process.platform === 'win32') {
          const updateInfo = {
            baseUrl: 'https://slobs-cdn.streamlabs.com',
            version: pjson.version,
            exec: process.argv,
            cwd: process.cwd(),
            waitPids: [process.pid],
            appDir: path.dirname(app.getPath('exe')),
            tempDir: path.join(app.getPath('temp'), 'slobs-updater'),
            cacheDir: app.getPath('userData'),
            versionFileName: `${releaseChannel}.json`,
          };
          bootstrap(updateInfo, startApp, app.exit);
        } else {
          new Updater(startApp, releaseChannel).run();
        }
      } else {
        app.quit();
      }
    });
  });

  // Pre-initialize the child window
  childWindow = new BrowserWindow({
    show: false,
    frame: false,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#17242D',
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false,
      contextIsolation: false,
    },
  });

  remote.enable(childWindow.webContents);

  childWindow.removeMenu();

  childWindow.loadURL(`${global.indexUrl}?windowId=child`);

  if (process.env.SLOBS_PRODUCTION_DEBUG) {
    childWindow.webContents.once('dom-ready', () => {
      childWindow.webContents.openDevTools({ mode: 'detach' });
    });
  }

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
  // WARNING! renderer windows use synchronous requests and will be frozen
  // until the worker window's asynchronous response
  const requests = {};

  function sendRequest(request, event = null, async = false) {
    if (workerWindow.isDestroyed()) {
      console.log('Tried to send request but worker window was missing...');
      return;
    }
    workerWindow.webContents.send('services-request', request);
    if (!event) return;
    requests[request.id] = Object.assign({}, request, { event, async });
  }

  // use this function to call some service method from the main process
  function callService(resource, method, ...args) {
    sendRequest({
      jsonrpc: '2.0',
      method,
      params: {
        resource,
        args,
      },
    });
  }

  ipcMain.on('AppInitFinished', () => {
    workerInitFinished = true;

    waitingVuexStores.forEach(winId => {
      BrowserWindow.fromId(winId).send('initFinished');
    });

    waitingVuexStores.forEach(windowId => {
      workerWindow.webContents.send('vuex-sendState', windowId);
    });
  });

  ipcMain.on('services-request', (event, payload) => {
    sendRequest(payload, event);
  });

  ipcMain.on('services-request-async', (event, payload) => {
    sendRequest(payload, event, true);
  });

  ipcMain.on('services-response', (event, response) => {
    if (!requests[response.id]) return;

    if (requests[response.id].async) {
      requests[response.id].event.reply('services-response-async', response);
    } else {
      requests[response.id].event.returnValue = response;
    }
    delete requests[response.id];
  });

  ipcMain.on('services-message', (event, payload) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (window.id === workerWindow.id || window.isDestroyed()) return;
      window.webContents.send('services-message', payload);
    });
  });

  if (isDevMode) {
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

const haDisableFile = path.join(app.getPath('userData'), 'HADisable');
if (fs.existsSync(haDisableFile)) app.disableHardwareAcceleration();

app.setAsDefaultProtocolClient('slobs');

app.on('second-instance', (event, argv, cwd) => {
  // Check for protocol links in the argv of the other process
  argv.forEach(arg => {
    if (arg.match(/^slobs:\/\//)) {
      workerWindow.send('protocolLink', arg);
    }
  });

  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  } else if (!shutdownStarted) {
    // This instance is a zombie and we should shut down.
    app.exit();
  }
});

let protocolLinkReady = false;
let pendingLink;

// For mac os, this event will fire when a protocol link is triggered
app.on('open-url', (e, url) => {
  if (protocolLinkReady) {
    workerWindow.send('protocolLink', url);
  } else {
    pendingLink = url;
  }
});

ipcMain.on('protocolLinkReady', () => {
  protocolLinkReady = true;
  if (pendingLink) workerWindow.send('protocolLink', pendingLink);
});

app.on('ready', () => {
  startApp();
});

ipcMain.on('openDevTools', () => {
  openDevTools();
});

ipcMain.on('window-closeChildWindow', event => {
  // never close the child window, hide it instead
  if (!childWindow.isDestroyed()) childWindow.hide();
});

ipcMain.on('window-focusMain', () => {
  if (!mainWindow.isDestroyed()) mainWindow.focus();
});

// The main process acts as a hub for various windows
// syncing their vuex stores.
const registeredStores = {};

ipcMain.on('vuex-register', event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const windowId = win.id;

  // Register can be received multiple times if the window is
  // refreshed.  We only want to register it once.
  if (!registeredStores[windowId]) {
    registeredStores[windowId] = win;
    console.log('Registered vuex stores: ', Object.keys(registeredStores));

    // Make sure we unregister is when it is closed
    win.on('closed', () => {
      delete registeredStores[windowId];
      console.log('Registered vuex stores: ', Object.keys(registeredStores));
    });
  }

  if (windowId !== workerWindow.id) {
    // Tell the worker window to send its current store state
    // to the newly registered window

    if (workerInitFinished) {
      win.send('initFinished');
      workerWindow.webContents.send('vuex-sendState', windowId);
    } else {
      waitingVuexStores.push(windowId);
    }
  }
});

// Proxy vuex-mutation events to all other subscribed windows
ipcMain.on('vuex-mutation', (event, mutation) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  if (senderWindow && !senderWindow.isDestroyed()) {
    const windowId = senderWindow.id;

    Object.keys(registeredStores)
      .filter(id => id !== windowId.toString())
      .forEach(id => {
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

const guestApiInfo = {};

ipcMain.on('guestApi-setInfo', (e, info) => {
  guestApiInfo[info.webContentsId] = {
    schema: info.schema,
    hostWebContentsId: info.hostWebContentsId,
    ipcChannel: info.ipcChannel,
  };
});

ipcMain.on('guestApi-getInfo', e => {
  e.returnValue = guestApiInfo[e.sender.id];
});

/* The following 3 methods need to live in the main process
    because events bound using the remote module are not
    executed synchronously and therefore default actions
    cannot be prevented. */
ipcMain.on('webContents-preventNavigation', (e, id) => {
  const contents = webContents.fromId(id);

  if (contents.isDestroyed()) return;

  contents.on('will-navigate', e => {
    e.preventDefault();
  });
});

ipcMain.on('webContents-bindYTChat', (e, id) => {
  const contents = webContents.fromId(id);

  if (contents.isDestroyed()) return;

  contents.on('will-navigate', (e, targetUrl) => {
    const url = require('url');
    const parsed = url.parse(targetUrl);

    if (parsed.hostname === 'accounts.google.com') {
      e.preventDefault();
    }
  });
});

ipcMain.on('webContents-enableRemote', (e, id) => {
  const contents = webContents.fromId(id);

  if (contents.isDestroyed()) return;

  remote.enable(contents);

  // Needed otherwise the renderer will lock up
  e.returnValue = null;
});

ipcMain.on('getMainWindowWebContentsId', e => {
  e.returnValue = mainWindow.webContents.id;
});

ipcMain.on('requestPerformanceStats', e => {
  const stats = app.getAppMetrics();
  e.sender.send('performanceStatsResponse', stats);
});

ipcMain.on('showErrorAlert', () => {
  if (!mainWindow.isDestroyed()) {
    // main window may be destroyed on shutdown
    mainWindow.send('showErrorAlert');
  }
});

ipcMain.on('gameOverlayPaintCallback', (e, { contentsId, overlayId }) => {
  const contents = webContents.fromId(contentsId);

  if (contents.isDestroyed()) return;

  contents.on('paint', (event, dirty, image) => {
    if (
      overlay.paintOverlay(
        overlayId,
        image.getSize().width,
        image.getSize().height,
        image.getBitmap(),
      ) === 0
    ) {
      contents.invalidate();
    }
  });
});

ipcMain.on('getWindowIds', e => {
  e.returnValue = {
    worker: workerWindow.id,
    main: mainWindow.id,
    child: childWindow.id,
  };
});

ipcMain.on('getAppStartTime', e => {
  e.returnValue = appStartTime;
});

ipcMain.on('measure-time', (e, msg, time) => {
  measure(msg, time);
});

// Measure time between events
function measure(msg, time) {
  if (!time) time = Date.now();
  const delta = lastEventTime ? time - lastEventTime : 0;
  lastEventTime = time;
  if (delta > 2000) console.log('------------------');
  console.log(msg, delta + 'ms');
}

ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', (event, opts) => desktopCapturer.getSources(opts));

// Message channel handling
const channels = {};

ipcMain.handle('create-message-channel', () => {
  const id = uuid();
  channels[id] = new MessageChannelMain();
  return id;
});

ipcMain.on('request-message-channel-in', (e, id) => {
  e.senderFrame.postMessage(`port-${id}`, null, [channels[id].port1]);
});

ipcMain.on('request-message-channel-out', (e, id) => {
  e.senderFrame.postMessage(`port-${id}`, null, [channels[id].port2]);
});
