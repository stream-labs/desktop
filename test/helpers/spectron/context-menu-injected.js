// This script is injected into the electron app and
// replaces the Menu with a fake one that lets us
// interact with it.

// Inspired by: https://github.com/joe-re/spectron-fake-menu

const electron = require('electron');

let currentMenu;

electron.Menu.prototype.popup = function popup() {
  currentMenu = this;
};

function getItem(menu, label) {
  const found = menu.items.find(item => {
    return item.label.indexOf(label) !== -1;
  });

  return found.submenu ?? found;
}

electron.ipcMain.on('__SPECTRON_FAKE_CONTEXT_MENU', (e, label) => {
  if (typeof label === 'string') {
    getItem(currentMenu, label).click();
  } else if (Array.isArray(label)) {
    let current = currentMenu;
    const path = [...label];

    while (path.length > 0) {
      current = getItem(current, path.shift());
    }

    current.click();
  }
});
