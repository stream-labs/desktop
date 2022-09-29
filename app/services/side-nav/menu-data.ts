import { TAppPage } from 'services/navigation';

export interface IMenu {
  name: string;
  isOpen: boolean;
  isLegacy: boolean; // Users created after sidebar navigation refactor will see fewer menu items
  menuItems: (IMenuItem | IParentMenuItem)[];
}

export interface IMenuItem {
  target?: TAppPage | 'NavTools'; // optional because menu item could be a toggle
  title: string;
  trackingTarget?: string;
  icon?: string;
  isActive?: boolean;
  isLegacy?: boolean;
}

export interface IParentMenuItem extends IMenuItem {
  isExpanded?: boolean;
  isToggled?: boolean;
  isEditor?: boolean;
  subMenuItems: IMenuItem[];
}

export enum ENavName {
  TopNav = 'top-nav',
  BottomNav = 'bottom-nav',
  Login = 'login-button',
}

export enum EMenuItem {
  Editor = 'Editor',
  AlertBox = 'Alert Box',
  LayoutEditor = 'Layout Editor',
  StudioMode = 'Studio Mode',
  Themes = 'Themes',
  AppStore = 'App Store',
  Highlighter = 'Highlighter',
  ThemeAudit = 'Theme Audit',
  DevTools = 'Dev Tools',
  GetPrime = 'Get Prime',
  Dashboard = 'Dashboard',
  GetHelp = 'Get Help',
  Settings = 'Settings',
  Login = 'Login',
}

export enum ESubMenuItem {
  Scene = 'Scene',
  Widget = 'Widget',
  TipPage = 'Tip Page',
  AppsManager = 'Apps Manager',
  Cloudbot = 'Cloudbot',
  AlertBox = 'Alert Box',
  Widgets = 'Widgets',
  TipSettings = 'Tip Settings',
  Multistream = 'Multistream',
}

export const SideBarTopNavData = (): IMenu => ({
  name: ENavName.TopNav,
  isOpen: false, // TODO: update to be set by user settings on layout load
  isLegacy: true, // TODO: update to be set by user creation date
  menuItems: [
    SideNavMenuItems()[EMenuItem.Editor],
    SideNavMenuItems()[EMenuItem.AlertBox],
    SideNavMenuItems()[EMenuItem.LayoutEditor],
    SideNavMenuItems()[EMenuItem.StudioMode],
    SideNavMenuItems()[EMenuItem.Themes],
    SideNavMenuItems()[EMenuItem.AppStore],
    SideNavMenuItems()[EMenuItem.Highlighter],
    SideNavMenuItems()[EMenuItem.ThemeAudit],
  ],
});

export const SideBarBottomNavData = (): IMenu => ({
  name: ENavName.BottomNav,
  isOpen: false, // TODO: update to be set by user settings on layout load
  isLegacy: true, // TODO: update to be set by user creation date
  menuItems: [
    SideNavMenuItems()[EMenuItem.DevTools],
    SideNavMenuItems()[EMenuItem.GetPrime],
    SideNavMenuItems()[EMenuItem.Dashboard],
    SideNavMenuItems()[EMenuItem.GetHelp],
    SideNavMenuItems()[EMenuItem.Settings],
  ],
});

export const Login = (): IMenu => ({
  name: ENavName.Login,
  isOpen: false,
  isLegacy: true,
  menuItems: [SideNavMenuItems()[EMenuItem.Login]],
});

export type TNavMenu = {
  [Nav in ENavName]: IMenu;
};

export const SideNavMenu = (): TNavMenu => ({
  [ENavName.TopNav]: SideBarTopNavData(),
  [ENavName.BottomNav]: SideBarBottomNavData(),
  [ENavName.Login]: Login(),
});

export type TMenuItems = {
  [MenuItem in EMenuItem]: IMenuItem | IParentMenuItem;
};

export const SideNavMenuItems = (): TMenuItems => ({
  [EMenuItem.Editor]: {
    target: 'Studio',
    title: EMenuItem.Editor,
    trackingTarget: 'editor',
    icon: 'icon-studio',
    isLegacy: false,
    isActive: true,
    isExpanded: false,
    isEditor: true, // if true, will show themes in bar when minimized
    // if the user has themes, they will be listed in a subMenuItems property. The trackingTarget is 'custom' e.g: tab === 'default' ? 'editor' : 'custom'
  },
  [EMenuItem.AlertBox]: SideBarSubMenuItems()[ESubMenuItem.AlertBox],
  [EMenuItem.LayoutEditor]: {
    target: 'LayoutEditor',
    title: EMenuItem.LayoutEditor,
    trackingTarget: 'layout-editor',
    icon: 'fas fa-th-large',
    // isActive: false,
    isLegacy: true,
    isActive: true, // true for now for coding purposes
  },
  [EMenuItem.StudioMode]: {
    // target: '', this toggles studio mode
    title: EMenuItem.StudioMode,
    trackingTarget: 'studio-mode',
    icon: 'icon-studio-mode-3',
    // isActive: false,
    isLegacy: true,
    isToggled: false, // toggles
    isActive: true, // true for now for coding purposes
  },
  [EMenuItem.Themes]: {
    target: 'BrowseOverlays',
    title: EMenuItem.Themes,
    trackingTarget: 'themes', // maybe required?
    // isActive: false, // maybe track in MenuStatus
    icon: 'icon-themes',
    isExpanded: false,
    subMenuItems: [
      SideBarSubMenuItems()[ESubMenuItem.Scene],
      SideBarSubMenuItems()[ESubMenuItem.AlertBox],
      SideBarSubMenuItems()[ESubMenuItem.Widget],
      SideBarSubMenuItems()[ESubMenuItem.TipPage],
    ],
    isActive: true, // true for now for coding purposes
  },

  [EMenuItem.AppStore]: {
    target: 'PlatformAppStore',
    title: EMenuItem.AppStore,
    trackingTarget: 'app-store',
    icon: 'icon-store',
    // isActive: false,
    isExpanded: false,
    subMenuItems: [SideBarSubMenuItems()[ESubMenuItem.AppsManager]],
    isActive: true, // true for now for coding purposes
  },
  // apps here. ...enabledApps.map(app => app.id)]
  [EMenuItem.Highlighter]: {
    target: 'Highlighter',
    icon: 'icon-highlighter',
    title: EMenuItem.Highlighter,
    trackingTarget: 'highlighter',
    // isActive: false,
    isActive: true, // true for now for coding purposes
  },
  [EMenuItem.ThemeAudit]: {
    target: 'ThemeAudit',
    icon: 'fas fa-exclamation-triangle',
    title: EMenuItem.ThemeAudit,
    trackingTarget: 'themeaudit',
    // isActive: false,
    isActive: true, // true for now for coding purposes
  },
  [EMenuItem.DevTools]: {
    title: EMenuItem.DevTools,
    trackingTarget: 'editor',
    icon: 'icon-developer',
    isLegacy: false,
    isActive: true,
  },
  [EMenuItem.GetPrime]: {
    title: EMenuItem.GetPrime,
    icon: 'icon-prime',
    isLegacy: false,
    isActive: true,
  },
  [EMenuItem.Dashboard]: {
    title: EMenuItem.Dashboard,
    icon: 'icon-dashboard',
    isLegacy: false,
    isActive: true,
    subMenuItems: [
      SideBarSubMenuItems()[ESubMenuItem.Cloudbot],
      SideBarSubMenuItems()[ESubMenuItem.AlertBox],
      SideBarSubMenuItems()[ESubMenuItem.Widgets],
      SideBarSubMenuItems()[ESubMenuItem.TipSettings],
      SideBarSubMenuItems()[ESubMenuItem.Multistream],
    ],
  },
  [EMenuItem.GetHelp]: {
    title: EMenuItem.GetHelp,
    icon: 'icon-question',
    isLegacy: false,
    isActive: true,
  },
  [EMenuItem.Settings]: {
    title: EMenuItem.Settings,
    icon: 'icon-settings',
    isLegacy: false,
    isActive: true,
  },
  [EMenuItem.Login]: {
    title: EMenuItem.Login,
    icon: 'icon-user',
    isLegacy: false,
    isActive: true,
  },
});

type TSubMenuItems = {
  [MenuItem in ESubMenuItem]: IMenuItem | IParentMenuItem;
};

export const SideBarSubMenuItems = (): TSubMenuItems => ({
  [ESubMenuItem.Scene]: {
    target: 'BrowseOverlays', // to the scene tab
    title: ESubMenuItem.Scene,
    // trackingTarget?: 'themes', // maybe required?
    isActive: false, // maybe track in MenuStatus
  },
  [ESubMenuItem.Widget]: {
    // target: 'Widget', TODO: where does this go?
    title: ESubMenuItem.Widget,
    // trackingTarget?: 'themes', // maybe required?
    isActive: false, // maybe track in MenuStatus
  },
  [ESubMenuItem.TipPage]: {
    // target: 'Tip Page', TODO: where does this go?
    title: ESubMenuItem.TipPage,
    // trackingTarget?: 'themes', // maybe required?
    isActive: false, // maybe track in MenuStatus
  },
  [ESubMenuItem.AppsManager]: {
    target: 'PlatformAppMainPage', // to the My Apps tab in Profile?
    title: 'Apps Manager',
    // trackingTarget?: 'themes', // maybe required?
    isActive: false, // maybe track in MenuStatus
  },
  [ESubMenuItem.Cloudbot]: {
    title: ESubMenuItem.Cloudbot,
    isLegacy: false,
    isActive: true,
  },
  [ESubMenuItem.AlertBox]: {
    target: 'AlertboxLibrary',
    title: ESubMenuItem.AlertBox,
    trackingTarget: 'alertbox-library',
    icon: 'icon-alert-box',
    isActive: false,
    isLegacy: true,
  },
  [ESubMenuItem.Widgets]: {
    title: ESubMenuItem.Widgets,
    isLegacy: false,
    isActive: true,
  },
  [ESubMenuItem.TipSettings]: {
    title: ESubMenuItem.TipSettings,
    isLegacy: false,
    isActive: true,
  },
  [ESubMenuItem.Multistream]: {
    title: ESubMenuItem.Multistream,
    isLegacy: false,
    isActive: true,
  },
});
