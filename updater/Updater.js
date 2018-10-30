// This is the entry point to the auto-updater, and should
// be required by the main electron process.

const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain } = require('electron');

class Updater {
  // startApp is a callback that will start the app.  Ideally this
  // would have been done with a promise, but electron tries to quit
  // when the last window is closed, so the hand-off has to be
  // synchronous.  Otherwise, electron will quit as soon as we close
  // the auto updater.  Pre-initializing the mainWindow is now a
  // good option either, since then closing the auto updater will
  // orphan the main process in the background.
  constructor(startApp) {
    this.startApp = startApp;
  }

  run() {
    this.updateState = {};

    this.bindListeners();

    this.browserWindow = this.initWindow();

    autoUpdater.checkForUpdates().catch(() => {
      // This usually means there is no internet connection.
      // In this case, we shouldn't prevent starting the app.
      this.startApp();
      this.finished = true;
      this.browserWindow.close();
    });
  }

  // PRIVATE

  bindListeners() {
    autoUpdater.on('update-available', info => {
      this.updateState.version = info.version;
      this.updateState.percent = 0;
      this.pushState();
    });

    autoUpdater.on('update-not-available', () => {
      this.startApp();
      this.finished = true;
      this.browserWindow.close();
    });

    autoUpdater.on('download-progress', progress => {
      this.updateState.percent = progress.percent;
      this.updateState.bytesPerSecond = progress.percent;

      if (progress.percent === 100) {
        this.updateState.installing = true;
      }

      this.pushState();
    });

    autoUpdater.on('update-downloaded', () => {
      this.updateState.installing = true;
      this.pushState();
      autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', () => {
      this.updateState.error = true;
      this.pushState();
    });

    ipcMain.on('autoUpdate-getState', () => {
      this.pushState();
    });
  }

  initWindow() {
    const browserWindow = new BrowserWindow({
      width: 400,
      height: 180,
      frame: false,
      resizable: false,
      show: false,
    });

    browserWindow.on('ready-to-show', () => {
      browserWindow.show();
    });

    browserWindow.on('closed', () => {
      // Prevent leaving a zombie process
      if (!this.finished) app.quit();
    });

    browserWindow.loadURL('file://' + __dirname + '/index.html');

    return browserWindow;
  }

  pushState() {
    if (!this.browserWindow.isDestroyed()) {
      this.browserWindow.send('autoUpdate-pushState', this.updateState);
    }
  }
}

exports.Updater = Updater;
