// This script is injected into the electron app and
// replaces the Menu with a fake one that lets us
// interact with it.

// Inspired by: https://github.com/joe-re/spectron-fake-menu

const electron = require('electron');

let currentMenu;

// const originalPopup = electron.Menu.prototype.popup;
electron.Menu.prototype.popup = function popup() {
  currentMenu = this;
  // originalPopup.call(this);
};

electron.ipcMain.on('__SPECTRON_FAKE_CONTEXT_MENU', (e, id) => {
  const found = currentMenu.getMenuItemById(id);

  if (!found) {
    throw new Error(`context menu is not found specified by id: ${id}\n${currentMenu.items.map(x => x.label).join('\n')}`);
  }

  e.returnValue = found.click();
});
