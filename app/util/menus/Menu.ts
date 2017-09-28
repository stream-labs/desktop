// An abstraction on electron Menus

import electron from 'electron';
const { remote } = electron;

export class Menu {

  menu: Electron.Menu;

  constructor() {
    this.menu = new remote.Menu();
  }

  popup() {
    this.menu.popup(remote.getCurrentWindow());
  }

  append(options: Electron.MenuItemConstructorOptions) {
    this.menu.append(new remote.MenuItem(options));
  }

}
