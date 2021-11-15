const electron = require('electron');

(() => {
  let currentCb;
  let currentButtons;

  electron.dialog.showMessageBox = function showMessageBox(win, opts) {
    return new Promise(resolve => {
      currentCb = resolve;

      // Support alternate function signature where win is omitted
      if (win.buttons) {
        currentButtons = win.buttons;
      } else {
        currentButtons = opts.buttons;
      }
    });
  };

  electron.ipcMain.on('__SPECTRON_FAKE_MESSAGE_BOX', (e, buttonLabel) => {
    currentButtons.forEach((button, index) => {
      if (button === buttonLabel) currentCb({ response: index });
    });
  });
})();

(() => {
  let currentCb;

  electron.dialog.showSaveDialog = function showSaveDialog(win, opts) {
    return new Promise(resolve => {
      currentCb = resolve;
    });
  };

  electron.ipcMain.on('__SPECTRON_FAKE_SAVE_DIALOG', (e, filePath) => {
    currentCb({ filePath });
  });
})();
