const { app, BrowserWindow, ipcMain } = require('electron');
const obs = require('node-obs');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // TODO: NODE_ENV is not getting set yet
  if (process.env.NODE_ENV !== 'production') {
    const devtoolsInstaller = require('electron-devtools-installer');

    devtoolsInstaller.default(devtoolsInstaller.VUEJS_DEVTOOLS);
  }
});
