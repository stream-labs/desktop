const { app, BrowserWindow, ipcMain } = require('electron');
const obs = require('node-obs');
const _ = require('lodash');

let mainWindow;

app.on('ready', () => {
  global.pageUrl = 'file://' + __dirname + '/index.html';

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL(global.pageUrl);

  // TODO: NODE_ENV is not getting set yet
  if (process.env.NODE_ENV !== 'production') {
    const devtoolsInstaller = require('electron-devtools-installer');

    devtoolsInstaller.default(devtoolsInstaller.VUEJS_DEVTOOLS);
  }
});

// Vuex store syncing code
let registeredStores = [];

ipcMain.on('vuex-register', event => {
  let win = BrowserWindow.fromWebContents(event.sender);
  let windowId = win.id;

  registeredStores.push(windowId);

  // Make sure we unregister is when it is closed
  win.on('closed', () => {
    _.pull(registeredStores, windowId);
    console.log('Registered vuex stores: ', registeredStores);
  });

  console.log('Registered vuex stores: ', registeredStores);

  if (windowId !== mainWindow.id) {
    // Tell the mainWindow to send its current store state
    // to the newly registered window

    mainWindow.webContents.send('vuex-sendState', windowId);
  }
});

// Proxy vuex-mutation events to all other subscribed windows
ipcMain.on('vuex-mutation', (event, mutation) => {
  let windowId = BrowserWindow.fromWebContents(event.sender).id;

  _.each(_.without(registeredStores, windowId), subscribedId => {
    let win = BrowserWindow.fromId(subscribedId);
    win.webContents.send('vuex-mutation', mutation);
  });
});
