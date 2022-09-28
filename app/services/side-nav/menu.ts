import Vue from 'vue';
import { Inject, ViewHandler, InitAfter, PersistentStatefulService } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import {
  // IMenu,
  // IMenuItem,
  TNavMenu,
  TMenuItems,
  EMenuItem,
  SideNavMenu,
  SideNavMenuItems,
} from './menu-data';

interface ISideNavServiceState {
  sidebar: TNavMenu;
  menuItems: TMenuItems;
}

class SideNavViews extends ViewHandler<ISideNavServiceState> {
  get sidebar() {
    return this.state.sidebar;
  }

  get menuItems() {
    return this.state.menuItems;
  }

  getMenuItem(name: EMenuItem) {
    if (!name) return;
    return this.state.menuItems[name];
  }

  isMenuItemActive(name: EMenuItem) {
    if (!name) return;
    return this.state.menuItems[name].isActive;
  }
}

@InitAfter('UserService')
export class SideNavService extends PersistentStatefulService<ISideNavServiceState> {
  static defaultState: ISideNavServiceState = {
    sidebar: SideNavMenu(),
    menuItems: SideNavMenuItems(),
  };

  init() {
    super.init();

    // TODO: set menu state off of persisted local storage
  }

  get views() {
    return new SideNavViews(this.state);
  }

  toggleMenuItem(menuName: EMenuItem) {
    if (!menuName) return;
    this.TOGGLE_MENU_ITEM(menuName);
  }

  // setSubMenuStatus(menuName: EMenuItem) {
  //   if (!menuName) return;
  //   this.SET_EXPANDED_STATUS(menuName);
  // }

  @mutation()
  TOGGLE_MENU_ITEM(menuItemName: EMenuItem) {
    // show/hide menu items
    Vue.set(
      this.state.menuItems[menuItemName],
      'isActive',
      !this.state.menuItems[menuItemName].isActive,
    );
  }

  // @mutation()
  // SET_EXPANDED_STATUS(menuItemName: EMenuItem) {
  //   // show/hide submenu items
  //   if (this.state.menuItems[menuItemName].hasOwnProperty())
  //   Vue.set(
  //     this.state.menuItems[menuItemName],
  //     'isExpanded',
  //     !this.state.menuItems[menuItemName].isExpanded,
  //   );
  // }
}
