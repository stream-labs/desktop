const { app, BrowserWindow, ipcMain } = require('electron');
const obs = require('node-obs');

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

// Lets other windows discover the main window
ipcMain.on('getMainWindowId', event => {
  event.returnValue = mainWindow.id;
});
