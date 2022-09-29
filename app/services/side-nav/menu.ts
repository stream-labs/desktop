import Vue from 'vue';
import { Inject, ViewHandler, InitAfter, PersistentStatefulService } from 'services/core';
import { CustomizationService } from 'services/customization';
import { mutation } from 'services/core/stateful-service';
import {
  TNavMenu,
  TMenuItems,
  EMenuItem,
  SideNavMenu,
  SideNavMenuItems,
  ENavName,
  IMenu,
  Login,
  SideBarTopNavData,
  SideBarBottomNavData,
} from './menu-data';

interface ISideNavServiceState {
  compactView: boolean;
  sidebar: TNavMenu;
  menuItems: TMenuItems;
  [ENavName.TopNav]: IMenu;
  [ENavName.BottomNav]: IMenu;
  [ENavName.Login]: IMenu;
}

class SideNavViews extends ViewHandler<ISideNavServiceState> {
  get sidebar() {
    return this.state.sidebar;
  }

  get compactView() {
    return this.state.compactView;
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
    compactView: true,
    sidebar: SideNavMenu(),
    menuItems: SideNavMenuItems(),
    [ENavName.TopNav]: SideBarTopNavData(),
    [ENavName.BottomNav]: SideBarBottomNavData(),
    [ENavName.Login]: Login(),
  };
  @Inject() private customizationService: CustomizationService;

  init() {
    super.init();

    // TODO: set menu state off of persisted local storage
  }

  get views() {
    return new SideNavViews(this.state);
  }

  setCompactView() {
    this.SET_COMPACT_VIEW();
  }

  toggleMenuItem(navName: ENavName, menuItemName: EMenuItem) {
    this.TOGGLE_MENU_ITEM(navName, menuItemName);
  }

  // setSubMenuStatus(menuName: EMenuItem) {
  //   if (!menuName) return;
  //   this.SET_EXPANDED_STATUS(menuName);
  // }

  @mutation()
  private SET_COMPACT_VIEW() {
    this.state.compactView = !this.state.compactView;
    Object.keys(this.state.menuItems).forEach((menuName: EMenuItem) => {
      if (
        [EMenuItem.Editor, EMenuItem.Themes, EMenuItem.AppStore, EMenuItem.Highlighter].includes(
          menuName,
        )
      ) {
        this.state.menuItems[menuName].isActive = true;
      } else {
        this.state.menuItems[menuName].isActive = false;
      }
    });
    console.log('this.state after compact ', this.state);
  }

  @mutation()
  private TOGGLE_MENU_ITEM(navName: ENavName, menuItemName: EMenuItem) {
    // show/hide menu items
    console.log(
      'TOGGLING: this.state[navName].menuItems[menuItemName] ',
      this.state[navName].menuItems.find(menuItem => menuItem.title === menuItemName),
    );
    console.log(
      'EQUALS TO: this.state.menuItems[menuItemName] ',
      this.state.menuItems[menuItemName],
    );
    // find menu item and set to the opposite of current state
    this.state[navName].menuItems.find(
      menuItem => menuItem.title === menuItemName,
    ).isActive = !this.state[navName].menuItems.find(menuItem => menuItem.title === menuItemName)
      .isActive;

    // find menu item in object used for toggling custom navigation settings
    this.state.menuItems[menuItemName].isActive = !this.state.menuItems[menuItemName].isActive;
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
