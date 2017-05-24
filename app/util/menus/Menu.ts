// Base menu class

import electron from '../../vendor/electron';
const { remote } = electron;

export function menuItem(options: Electron.MenuItemOptions) {
  return (target: any, name: string, descriptor: PropertyDescriptor) => {
    const item = {
      ...options,
      click: descriptor.value
    };

    target.menuItems = target.menuItems || [];
    target.menuItems.push(item);

    return descriptor;
  };
}

export abstract class Menu {

  private menuItems: Electron.MenuItemOptions[];

  menu: Electron.Menu;

  constructor() {
    this.menu = new remote.Menu();

    this.menuItems.forEach(item => {
      this.menu.append(new remote.MenuItem({
        ...item,
        click: item.click.bind(this)
      }));
    });
  }

  popup() {
    this.menu.popup(remote.getCurrentWindow());
  }

}
