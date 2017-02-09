const { app, BrowserWindow, ipcMain } = require('electron');
const obs = require('node-obs');
const _ = require('lodash');
const URI = require('urijs');

let mainWindow;
const indexUrl = 'file://' + __dirname + '/index.html';

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false
  });

  mainWindow.webContents.openDevTools();

  let mainUrl = URI(indexUrl).query({ component: 'Main' })

  mainWindow.loadURL(mainUrl.toString());

  // TODO: NODE_ENV is not getting set yet
  if (process.env.NODE_ENV !== 'production') {
    const devtoolsInstaller = require('electron-devtools-installer');

    devtoolsInstaller.default(devtoolsInstaller.VUEJS_DEVTOOLS);
  }

    obs.OBS_API_initOBS_API();
    obs.OBS_API_openAllModules();
    obs.OBS_API_initAllModules();
});



// Used for spawning child windows. Will automatically
// replace any child window currently showing.
let childWindow;

ipcMain.on('window-spawnChildWindow', (event, data) => {
  // Close the existing child window
  if (childWindow && !childWindow.isDestroyed()) {
    childWindow.close();
  }

  const options = Object.assign({}, data.options, {
    parent: mainWindow
  });

  childWindow = new BrowserWindow(options);
  //childWindow.webContents.openDevTools();

  let childUrl = URI(indexUrl).query(data.startupOptions);

  childWindow.loadURL(childUrl.toString());
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
  const retVal = obs[data.method].apply(obs, data.args);

  console.log('OBS RETURN VALUE', retVal);

  // electron ipc doesn't like returning undefined, so
  // we return null instead.
  event.returnValue = retVal || null;
});

