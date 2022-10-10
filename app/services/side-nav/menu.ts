import { ViewHandler, InitAfter, PersistentStatefulService } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import {
  TMenuItems,
  EMenuItem,
  IMenuItem,
  SideNavMenuItems,
  ENavName,
  IMenu,
  IAppMenuItem,
  SideBarTopNavData,
  SideBarBottomNavData,
} from './menu-data';

interface ISideNavServiceState {
  isOpen: boolean;
  showCustomEditor: boolean;
  hasLegacyMenu: boolean;
  showSidebarApps: boolean;
  compactView: boolean;
  menuItems: TMenuItems;
  apps: {
    [appId: string]: IAppMenuItem;
  };
  [ENavName.TopNav]: IMenu;
  [ENavName.BottomNav]: IMenu;
}

class SideNavViews extends ViewHandler<ISideNavServiceState> {
  get isOpen() {
    return this.state.isOpen;
  }

  get compactView() {
    return this.state.compactView;
  }

  get menuItems() {
    return this.state.menuItems;
  }

  get hasLegacyMenu() {
    return this.state.hasLegacyMenu;
  }

  get apps() {
    return this.state.apps;
  }

  get showCustomEditor() {
    return this.state.showCustomEditor;
  }

  get showSidebarApps() {
    return this.state.showSidebarApps;
  }

  getMenuItem(name: EMenuItem) {
    if (!name) return;
    return this.state.menuItems[name];
  }

  isMenuItemActive(name: EMenuItem) {
    if (!name) return;
    return this.state.menuItems[name].isActive;
  }

  getExpandedMenuItems(name: ENavName) {
    if (!name) return;
    return this.state[name].menuItems.reduce((keys, menuItem: IMenuItem) => {
      if (menuItem.isExpanded) {
        keys.push(menuItem.title as string);
      }
      return keys;
    }, []);
  }
}

@InitAfter('UserService')
export class SideNavService extends PersistentStatefulService<ISideNavServiceState> {
  static defaultState: ISideNavServiceState = {
    isOpen: false,
    showCustomEditor: true,
    hasLegacyMenu: true, // TODO: true for now, set to false and then update based off of user creation date
    showSidebarApps: true,
    compactView: false,
    menuItems: SideNavMenuItems(),
    apps: {},
    [ENavName.TopNav]: SideBarTopNavData(),
    [ENavName.BottomNav]: SideBarBottomNavData(),
  };

  init() {
    super.init();
  }

  get views() {
    return new SideNavViews(this.state);
  }

  toggleMenuStatus() {
    this.OPEN_CLOSE_MENU();
  }

  setCompactView() {
    this.SET_COMPACT_VIEW();
  }

  expandMenuItem(navName: ENavName, menuItemName: EMenuItem) {
    // expand/contract menu items
    this.EXPAND_MENU_ITEM(navName, menuItemName);
  }

  toggleSidebarSubmenu() {
    // show/hide submenus shown at the parent level
    this.TOGGLE_SIDEBAR_SUBMENU();
  }

  toggleMenuItem(navName: ENavName, menuItemName: EMenuItem) {
    // show/hide menu items
    this.TOGGLE_MENU_ITEM(navName, menuItemName);
  }

  toggleApp(appId: string) {
    // show hide apps in menu
    this.TOGGLE_APP(appId);
  }

  swapApp(app: IAppMenuItem) {
    // add/update apps
    this.SWAP_APP(app);
  }

  @mutation()
  private OPEN_CLOSE_MENU() {
    this.state.isOpen = !this.state.isOpen;
  }

  @mutation()
  private SET_COMPACT_VIEW() {
    this.state.compactView = !this.state.compactView;
    if (this.state.compactView) {
      this.state.menuItems = {
        ...this.state.menuItems,
        // shown in compact view
        [EMenuItem.Editor]: { ...this.state.menuItems[EMenuItem.Editor], isActive: true },
        [EMenuItem.Themes]: { ...this.state.menuItems[EMenuItem.Themes], isActive: true },
        [EMenuItem.AppStore]: { ...this.state.menuItems[EMenuItem.AppStore], isActive: true },
        [EMenuItem.Highlighter]: { ...this.state.menuItems[EMenuItem.Highlighter], isActive: true },
        // hidden in compact view
        [EMenuItem.LayoutEditor]: {
          ...this.state.menuItems[EMenuItem.LayoutEditor],
          isActive: false,
        },
        [EMenuItem.StudioMode]: { ...this.state.menuItems[EMenuItem.StudioMode], isActive: false },
        [EMenuItem.ThemeAudit]: { ...this.state.menuItems[EMenuItem.ThemeAudit], isActive: false },
      };

      this.state[ENavName.TopNav] = {
        ...this.state[ENavName.TopNav],
        menuItems: [
          { ...this.state.menuItems[EMenuItem.Editor], isActive: true },
          { ...this.state.menuItems[EMenuItem.LayoutEditor], isActive: false },
          { ...this.state.menuItems[EMenuItem.StudioMode], isActive: false },
          { ...this.state.menuItems[EMenuItem.Themes], isActive: true },
          { ...this.state.menuItems[EMenuItem.AppStore], isActive: true },
          { ...this.state.menuItems[EMenuItem.Highlighter], isActive: true },
          { ...this.state.menuItems[EMenuItem.ThemeAudit], isActive: false },
        ],
      };
    }
  }

  @mutation()
  private TOGGLE_SIDEBAR_SUBMENU() {
    // currently only the custom editor needs to
    // have the option to show/hide in the sidebar
    this.state.showCustomEditor = !this.state.showCustomEditor;
  }

  @mutation()
  private TOGGLE_MENU_ITEM(navName: ENavName, menuItemName: EMenuItem) {
    // find menu item and set to the opposite of current state
    this.state[navName].menuItems.find(
      (menuItem: IMenuItem) => menuItem.title === menuItemName,
    ).isActive = !this.state[navName].menuItems.find(
      (menuItem: IMenuItem) => menuItem.title === menuItemName,
    ).isActive;

    // find menu item in object used for toggling custom navigation settings
    this.state.menuItems[menuItemName].isActive = !this.state.menuItems[menuItemName].isActive;

    // toggle sidebar apps
    if (menuItemName === EMenuItem.AppStore) {
      this.state.showSidebarApps = !this.state.showSidebarApps;
    }
  }

  @mutation()
  private TOGGLE_APP(appId: string) {
    this.state.apps = {
      ...this.state.apps,
      [appId]: { ...this.state.apps[appId], isActive: !this.state.apps[appId].isActive },
    };
  }

  @mutation()
  private SWAP_APP(app: IAppMenuItem) {
    let found = false;
    for (const [key, value] of Object.entries(this.state.apps)) {
      if (value.index === app.index) {
        // there is an app at this index
        if (this.state.apps[app.id]) {
          // the new app previously had an index, so swap the two apps
          found = true;
          this.state.apps = {
            ...this.state.apps,
            [key]: { ...value, index: this.state.apps[app.id].index },
            [app.id]: app,
          };
          break;
        }
      }
    }
    if (!found) {
      this.state.apps[app.id] = app;
    }
  }

  @mutation()
  private EXPAND_MENU_ITEM(navName: ENavName, menuItemName: EMenuItem) {
    this.state[navName].menuItems.find(
      (menuItem: IMenuItem) => menuItem.title === menuItemName,
    ).isExpanded = !this.state[navName].menuItems.find(
      (menuItem: IMenuItem) => menuItem.title === menuItemName,
    ).isExpanded;
  }
}
