const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow;
let maximized = false;

const startOBS = () => {
  let obs = require('node-obs');
  console.log(obs);

  obs.test_startStreamingFromConfigFile();
}

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    frame: false
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  //getCpuPercentage();
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

const getCpuPercentage = () => {
  const os = require('os');
  const cpus = os.cpus();

  let totalIdle = 0;
  let totalTick = 0;

  for(var i = 0, len = cpus.length; i < len; i++) {
      console.log("CPU %s:", i);
      let cpu = cpus[i], total = 0;

      for(var type in cpu.times) {
          total += cpu.times[type];
      }

      for(type in cpu.times) {
          console.log("\t", type, Math.round(100 * cpu.times[type] / total));
      }
  }
}

