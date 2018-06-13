// This script is injected into the electron app and
// replaces the Menu with a fake one that lets us
// interact with it.

// Inspired by: https://github.com/joe-re/spectron-fake-menu

const electron = require('electron');

let currentMenu;

electron.Menu.prototype.popup = function popup() {
  currentMenu = this;
};

electron.ipcMain.on('__SPECTRON_FAKE_CONTEXT_MENU', (e, label) => {
  const found = currentMenu.items.find(item => {
    return item.label.indexOf(label) !== -1;
  });

  found.click();
});
