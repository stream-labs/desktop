const electron = require('electron');

(() => {
  let currentCb;
  let currentButtons;

  electron.dialog.showMessageBox = function showMessageBox(win, opts, cb) {
    currentCb = cb;
    currentButtons = opts.buttons;
  };

  electron.ipcMain.on('__SPECTRON_FAKE_MESSAGE_BOX', (e, buttonLabel) => {
    currentButtons.forEach((button, index) => {
      if (button === buttonLabel) currentCb(index);
    });
  });
})();
