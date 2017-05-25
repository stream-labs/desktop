// An abstraction on electron Menus

import electron from '../../vendor/electron';
const { remote } = electron;

export abstract class Menu {

  menu: Electron.Menu;

  constructor() {
    this.menu = new remote.Menu();
  }

  popup() {
    this.menu.popup(remote.getCurrentWindow());
  }

  append(options: Electron.MenuItemOptions) {
    this.menu.append(new remote.MenuItem(options));
  }

}
