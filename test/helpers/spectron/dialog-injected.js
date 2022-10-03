const electron = require('electron');

(() => {
  let currentCb;
  let currentButtons;

  electron.dialog.showMessageBox = function showMessageBox(win, opts) {
    return new Promise((resolve) => {
      currentCb = resolve;
      currentButtons = opts.buttons;
    });
  };

  electron.ipcMain.on('__SPECTRON_FAKE_MESSAGE_BOX', (e, buttonLabel) => {
    console.log('fake dialog: ', buttonLabel, ' in ', currentButtons); // DEBUG
    currentButtons.forEach((button, index) => {
      if (button === buttonLabel) currentCb({ response: index });
    });
  });
})();
