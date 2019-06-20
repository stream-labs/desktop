const electron = require('electron');

(() => {
  let currentCb;
  let currentButtons;

  electron.dialog.showMessageBox = function showMessageBox(win, opts, cb) {
    // Support alternate function signature where win is omitted
    if (win.buttons) {
      currentCb = opts;
      currentButtons = win.buttons;
    } else {
      currentCb = cb;
      currentButtons = opts.buttons;
    }
  };

  electron.ipcMain.on('__SPECTRON_FAKE_MESSAGE_BOX', (e, buttonLabel) => {
    currentButtons.forEach((button, index) => {
      if (button === buttonLabel) currentCb(index);
    });
  });
})();
