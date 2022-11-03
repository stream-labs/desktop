import { ViewHandler, InitAfter, PersistentStatefulService, Inject } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import { UserService, AppService, DismissablesService } from 'app-services';
import { EDismissable } from 'services/dismissables';
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
  EMenuItemKey,
} from './menu-data';

interface ISideNavServiceState {
  isOpen: boolean;
  showCustomEditor: boolean;
  hasLegacyMenu: boolean;
  compactView: boolean;
  currentMenuItem: EMenuItemKey | string;
  menuItems: TMenuItems;
  apps: IAppMenuItem[];
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

  get menuItemStatus() {
    return this.state[ENavName.TopNav].menuItems.reduce((menuItems, menuItem) => {
      return { ...menuItems, [menuItem.title]: menuItem.isActive };
    }, {});
  }

  get hasLegacyMenu() {
    return this.state.hasLegacyMenu;
  }

  get currentMenuItem() {
    return this.state.currentMenuItem;
  }

  get apps() {
    return this.state.apps;
  }

  get showCustomEditor() {
    return this.state.showCustomEditor;
  }

  getExpandedMenuItems(name: ENavName) {
    if (!name) return;
    return this.state[name].menuItems.reduce((keys, menuItem: IMenuItem) => {
      if (menuItem.isExpanded) {
        keys.push(menuItem.key);
      }
      return keys;
    }, []);
  }
}

@InitAfter('UserService')
export class SideNavService extends PersistentStatefulService<ISideNavServiceState> {
  @Inject() userService: UserService;
  @Inject() appService: AppService;
  @Inject() dismissablesService: DismissablesService;

  static defaultState: ISideNavServiceState = {
    isOpen: false,
    showCustomEditor: true,
    hasLegacyMenu: true,
    currentMenuItem: EMenuItemKey.Editor,
    compactView: false,
    menuItems: SideNavMenuItems(),
    apps: [null, null, null, null, null], // up to five apps may be displayed in the closed sidebar
    [ENavName.TopNav]: SideBarTopNavData(),
    [ENavName.BottomNav]: SideBarBottomNavData(),
  };

  init() {
    super.init();

    const loggedIn = this.userService.views.isLoggedIn;

    // TODO: set Date to specific date
    const legacyMenu =
      this.userService.state.createdAt &&
      this.userService.state.createdAt < new Date('October 12, 2022').valueOf();

    if (loggedIn) {
      console.log('loggedIn');
      this.dismissablesService.dismiss(EDismissable.LoginPrompt);
      if (legacyMenu && !this.appService.state.onboarded) {
        console.log('onboarded');
        // show for legacy user's first startup after new side nav date
        this.dismissablesService.views.shouldShow(EDismissable.NewSideNav);
        this.dismissablesService.views.shouldShow(EDismissable.CustomMenuSettings);
      } else {
        this.dismissablesService.dismiss(EDismissable.NewSideNav);
        this.dismissablesService.dismiss(EDismissable.CustomMenuSettings);
      }
    } else {
      // the user is not logged in
      console.log('not loggedIn');
      if (legacyMenu) {
        console.log('legacy');
        this.dismissablesService.dismiss(EDismissable.LoginPrompt);
        if (!this.appService.state.onboarded) {
          console.log('legacy not onboarded');
          this.dismissablesService.views.shouldShow(EDismissable.NewSideNav);
          this.dismissablesService.views.shouldShow(EDismissable.CustomMenuSettings);
        } else {
          console.log('legacy onboarded');
          this.dismissablesService.dismiss(EDismissable.NewSideNav);
          this.dismissablesService.dismiss(EDismissable.CustomMenuSettings);
        }
      } else {
        console.log('else');
        if (this.state.hasLegacyMenu) {
          // this is a new user opening the app for the first time
          console.log('huh?');
          this.state.hasLegacyMenu = false;
        }
        this.dismissablesService.views.shouldShow(EDismissable.LoginPrompt);
        this.dismissablesService.dismiss(EDismissable.NewSideNav);
        this.dismissablesService.dismiss(EDismissable.CustomMenuSettings);
      }
    }

    this.state.currentMenuItem = EMenuItemKey.Editor;
  }

  get views() {
    return new SideNavViews(this.state);
  }

  toggleMenuStatus() {
    this.OPEN_CLOSE_MENU();
  }

  setCurrentMenuItem(key: EMenuItemKey | string) {
    this.SET_CURRENT_MENU_ITEM(key);
  }

  setCompactView(isCompact: boolean) {
    this.SET_COMPACT_VIEW(isCompact);
  }

  setNewUserLogin() {
    this.SET_NEW_USER_LOGIN();
  }

  setLegacyView() {
    this.SET_LEGACY_VIEW();
  }

  expandMenuItem(navName: ENavName, key: EMenuItemKey) {
    // expand/contract menu items
    this.EXPAND_MENU_ITEM(navName, key);
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

  swapApp(newApp: IAppMenuItem, index: number) {
    // add/update apps
    this.SWAP_APP(newApp, index);
  }

  @mutation()
  private SET_COMPACT_VIEW(isCompact: boolean) {
    this.state = { ...this.state, compactView: isCompact };
  }

  @mutation()
  private SET_NEW_USER_LOGIN() {
    // compact view with menu items expanded
    this.state.isOpen = true;
    // this.state.showCustomEditor = false;
    // this.state.compactView = true;

    this.state[ENavName.TopNav] = {
      ...this.state[ENavName.TopNav],
      menuItems: [
        { ...SideNavMenuItems()[EMenuItem.Editor], isActive: true },
        { ...SideNavMenuItems()[EMenuItem.LayoutEditor], isActive: false },
        { ...SideNavMenuItems()[EMenuItem.StudioMode], isActive: false },
        { ...SideNavMenuItems()[EMenuItem.Themes], isActive: true },
        { ...SideNavMenuItems()[EMenuItem.AppStore], isActive: true },
        { ...SideNavMenuItems()[EMenuItem.Highlighter], isActive: true },
        { ...SideNavMenuItems()[EMenuItem.ThemeAudit], isActive: true },
      ],
    };

    this.state[ENavName.BottomNav] = {
      ...this.state[ENavName.BottomNav],
      menuItems: this.state[ENavName.BottomNav].menuItems.map((menuItem: IMenuItem) => {
        if (menuItem.title === EMenuItem.Dashboard) {
          return { ...this.state.menuItems[EMenuItem.Dashboard], isExpanded: true };
        }
        return menuItem;
      }),
    };
  }

  @mutation()
  private SET_LEGACY_VIEW() {
    this.state.showCustomEditor = true;
    this.state.compactView = false;

    this.state.menuItems = {
      ...this.state.menuItems,
      [EMenuItem.Editor]: { ...this.state.menuItems[EMenuItem.Editor], isActive: true },
      [EMenuItem.Themes]: { ...this.state.menuItems[EMenuItem.Themes], isActive: true },
      [EMenuItem.AppStore]: { ...this.state.menuItems[EMenuItem.AppStore], isActive: true },
      [EMenuItem.Highlighter]: { ...this.state.menuItems[EMenuItem.Highlighter], isActive: true },
      [EMenuItem.LayoutEditor]: { ...this.state.menuItems[EMenuItem.LayoutEditor], isActive: true },
      [EMenuItem.StudioMode]: { ...this.state.menuItems[EMenuItem.StudioMode], isActive: true },
      [EMenuItem.ThemeAudit]: { ...this.state.menuItems[EMenuItem.ThemeAudit], isActive: true },
    };

    this.state[ENavName.TopNav] = {
      ...this.state[ENavName.TopNav],
      menuItems: [
        { ...this.state.menuItems[EMenuItem.Editor], isActive: true },
        { ...this.state.menuItems[EMenuItem.LayoutEditor], isActive: true },
        { ...this.state.menuItems[EMenuItem.StudioMode], isActive: true },
        { ...this.state.menuItems[EMenuItem.Themes], isActive: true },
        { ...this.state.menuItems[EMenuItem.AppStore], isActive: true },
        { ...this.state.menuItems[EMenuItem.Highlighter], isActive: true },
        { ...this.state.menuItems[EMenuItem.ThemeAudit], isActive: true },
      ],
    };
  }

  @mutation()
  private OPEN_CLOSE_MENU() {
    this.state.isOpen = !this.state.isOpen;
  }

  @mutation()
  private TOGGLE_SIDEBAR_SUBMENU() {
    // currently only the custom editor needs to
    // have the option to show/hide in the sidebar
    this.state.showCustomEditor = !this.state.showCustomEditor;
  }

  @mutation()
  private TOGGLE_MENU_ITEM(navName: ENavName, menuItemName: EMenuItem) {
    // toggle boolean value
    this.state[navName].menuItems.find(
      (menuItem: IMenuItem) => menuItem.title === menuItemName,
    ).isActive = !this.state[navName].menuItems.find(
      (menuItem: IMenuItem) => menuItem.title === menuItemName,
    ).isActive;
  }

  @mutation()
  private TOGGLE_APP(appId: string) {
    this.state.apps = this.state.apps.map(app => {
      if (!app) return null;

      if (app.id === appId) {
        return { ...app, isActive: !app.isActive };
      }

      return app;
    });
  }

  @mutation()
  private SWAP_APP(newApp: IAppMenuItem, index: number) {
    const updatedApps = this.state.apps.map((app, i) => {
      if (i === index) return newApp;

      if (!app || app?.id === newApp.id) {
        // if the new app is already in the array, remove it
        return null;
      }

      return app;
    });
    this.state.apps = updatedApps;
  }

  @mutation()
  private EXPAND_MENU_ITEM(navName: ENavName, key: EMenuItemKey) {
    // toggle boolean value
    this.state[navName] = {
      ...this.state[navName],
      menuItems: [
        ...this.state[navName].menuItems.map(menuItem => {
          if (menuItem.key === key) {
            return { ...menuItem, isExpanded: !menuItem.isExpanded };
          }
          return menuItem;
        }),
      ],
    };
  }

  @mutation()
  private SET_CURRENT_MENU_ITEM(key: EMenuItemKey | string) {
    this.state.currentMenuItem = key;
  }
}
