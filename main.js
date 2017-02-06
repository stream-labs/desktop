const { app, BrowserWindow, ipcMain } = require('electron');
const obs = require('node-obs');

let mainWindow;
let maximized = false;

const startOBS = () => {


  //obs.OBS_service_test_startStreaming();

  //obs.test_startStreamingFromConfigFile();
}

const initObs = () => {
  obs.OBS_API_initOBS_API();
  obs.OBS_API_openAllModules();
  obs.OBS_API_initAllModules();
}

// For now, create a fresh scene when we start up
const initScenes = () => {
  obs.OBS_content_createScene('test');

  console.log(obs.OBS_content_getListCurrentScenes());
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

  //initObs();

  //initScenes();

  //obs.OBS_service_test_startStreaming();
});
