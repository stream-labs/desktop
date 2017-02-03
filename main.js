const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow;
let maximized = false;

const startOBS = () => {
  let obs = require('node-obs');
  console.log(obs);


  obs.OBS_API_initOBS_API();
  obs.OBS_API_openAllModules();
  obs.OBS_API_initAllModules();
  //obs.test_startStreamingFromConfigFile();
}

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  //startOBS();
});

ipcMain.on('window.minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window.maximize', () => {
  if (maximized) {
    mainWindow.unmaximize();
    maximized = false;
  } else {
    mainWindow.maximize();
    maximized = true;
  }
});

ipcMain.on('window.close', () => {
  mainWindow.close();
});
