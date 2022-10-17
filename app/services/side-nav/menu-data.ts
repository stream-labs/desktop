import { TAppPage } from 'services/navigation';

export enum EMenuItemKey {
  Editor = 'editor',
  LayoutEditor = 'layout-editor',
  StudioMode = 'studio-mode',
  Themes = 'themes',
  AppStore = 'app-store',
  Highlighter = 'highlighter',
  ThemeAudit = 'theme-audit',
  DevTools = 'dev-tools',
  GetPrime = 'get-prime',
  Dashboard = 'dashboard',
  GetHelp = 'get-help',
  Settings = 'settings',
  Login = 'login',
  Scene = 'browse-overlays',
  AlertBoxLibrary = 'alertbox-library',
  Widget = 'browse-overlays-widgets',
  Sites = 'browse-overlays-sites',
  AppsStoreHome = 'platform-app-store-home',
  AppsManager = 'platform-app-store-manager',
  DashboardHome = 'dashboard-home',
  Cloudbot = 'dashboard-cloudbot',
  AlertBoxSettings = 'dashboard-alertbox',
  Widgets = 'dashboard-widgets',
  TipSettings = 'dashboard-tips',
  Multistream = 'dashboard-multistream',
}

export type TExternalLinkType =
  | 'overlay'
  | 'widget-theme' // TODO: confirm param
  | 'site-theme' // TODO: confirm param
  | 'cloudbot'
  | 'alertbox'
  | 'widgets'
  | 'tipping/methods'
  | 'multistream/settings';

type TSideNavItem = TAppPage | TExternalLinkType | 'NavTools' | 'WidgetWindow' | string;

export interface IAppMenuItem {
  id?: string;
  name?: string;
  isActive: boolean;
  icon?: string;
  index: number;
}
export interface IMenu {
  name: string;
  menuItems: (IMenuItem | IParentMenuItem)[];
}

export interface IMenuItem {
  key: TSideNavItem;
  target?: TSideNavItem; // optional because menu item could be a toggle
  type?: TExternalLinkType | string;
  title: string;
  trackingTarget?: string;
  icon?: string;
  isExpanded: boolean;
  isActive?: boolean;
}

export interface IParentMenuItem extends IMenuItem {
  isToggled?: boolean;
  subMenuItems: IMenuItem[];
}

export enum ENavName {
  TopNav = 'top-nav',
  BottomNav = 'bottom-nav',
}

export enum EMenuItem {
  Editor = 'Editor',
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
  AlertBoxLibrary = 'Alert Box Library',
  Widget = 'Widget',
  Sites = 'Sites',
  AppsStoreHome = 'Apps Store Home',
  AppsManager = 'Apps Manager',
  DashboardHome = 'Dashboard Home',
  Cloudbot = 'Cloudbot',
  AlertBoxSettings = 'Alert Box',
  Widgets = 'Widgets',
  TipSettings = 'Tip Settings',
  Multistream = 'Multistream',
}

export const SideBarTopNavData = (): IMenu => ({
  name: ENavName.TopNav,
  menuItems: [
    SideNavMenuItems()[EMenuItem.Editor],
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
  menuItems: [
    SideNavMenuItems()[EMenuItem.DevTools],
    SideNavMenuItems()[EMenuItem.GetPrime],
    SideNavMenuItems()[EMenuItem.Dashboard],
    SideNavMenuItems()[EMenuItem.GetHelp],
    SideNavMenuItems()[EMenuItem.Settings],
    SideNavMenuItems()[EMenuItem.Login],
  ],
});

export type TMenuItems = {
  [MenuItem in EMenuItem]: IMenuItem | IParentMenuItem;
};

// the key for primary menu items must be the title
// so that the menu can apply open menu items on startup
export const SideNavMenuItems = (): TMenuItems => ({
  [EMenuItem.Editor]: {
    key: EMenuItemKey.Editor,
    target: 'Studio',
    title: EMenuItem.Editor,
    trackingTarget: 'editor',
    icon: 'icon-studio',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.LayoutEditor]: {
    key: EMenuItemKey.LayoutEditor,
    target: 'LayoutEditor',
    title: EMenuItem.LayoutEditor,
    trackingTarget: 'layout-editor',
    icon: 'fas fa-th-large',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.StudioMode]: {
    key: EMenuItemKey.StudioMode,
    title: EMenuItem.StudioMode,
    icon: 'icon-studio-mode-3',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Themes]: {
    key: EMenuItemKey.Themes,
    target: 'BrowseOverlays',
    title: EMenuItem.Themes,
    trackingTarget: 'themes',
    icon: 'icon-themes',
    subMenuItems: [
      SideBarSubMenuItems()[ESubMenuItem.Scene],
      SideBarSubMenuItems()[ESubMenuItem.AlertBoxLibrary],
      SideBarSubMenuItems()[ESubMenuItem.Widget],
      SideBarSubMenuItems()[ESubMenuItem.Sites],
    ],
    isActive: true,
    isExpanded: false,
  },

  [EMenuItem.AppStore]: {
    key: EMenuItemKey.AppStore,
    target: 'PlatformAppStore',
    title: EMenuItem.AppStore,
    trackingTarget: 'app-store',
    icon: 'icon-store',
    subMenuItems: [
      SideBarSubMenuItems()[ESubMenuItem.AppsStoreHome],
      SideBarSubMenuItems()[ESubMenuItem.AppsManager],
    ],
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Highlighter]: {
    key: EMenuItemKey.Highlighter,
    target: 'Highlighter',
    icon: 'icon-highlighter',
    title: EMenuItem.Highlighter,
    trackingTarget: 'highlighter',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.ThemeAudit]: {
    key: EMenuItemKey.ThemeAudit,
    target: 'ThemeAudit',
    icon: 'fas fa-exclamation-triangle',
    title: EMenuItem.ThemeAudit,
    trackingTarget: 'themeaudit',
    isActive: true, // showing/hiding is handled in the SideNav component
    isExpanded: false,
  },
  [EMenuItem.DevTools]: {
    key: EMenuItemKey.DevTools,
    title: EMenuItem.DevTools,
    trackingTarget: 'devtools',
    icon: 'icon-developer',
    isActive: true, // showing/hiding is handled in the SideNav component
    isExpanded: false,
  },
  [EMenuItem.GetPrime]: {
    key: EMenuItemKey.GetPrime,
    title: EMenuItem.GetPrime,
    icon: 'icon-prime',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Dashboard]: {
    key: EMenuItemKey.Dashboard,
    title: EMenuItem.Dashboard,
    icon: 'icon-dashboard',
    isActive: true,
    subMenuItems: [
      SideBarSubMenuItems()[ESubMenuItem.DashboardHome],
      SideBarSubMenuItems()[ESubMenuItem.Cloudbot],
      SideBarSubMenuItems()[ESubMenuItem.AlertBoxSettings],
      SideBarSubMenuItems()[ESubMenuItem.Widgets],
      SideBarSubMenuItems()[ESubMenuItem.TipSettings],
      SideBarSubMenuItems()[ESubMenuItem.Multistream],
    ],
    isExpanded: false,
  },
  [EMenuItem.GetHelp]: {
    key: EMenuItemKey.GetHelp,
    title: EMenuItem.GetHelp,
    icon: 'icon-question',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Settings]: {
    key: EMenuItemKey.Settings,
    title: EMenuItem.Settings,
    icon: 'icon-settings',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Login]: {
    key: EMenuItemKey.Login,
    title: EMenuItem.Login,
    icon: 'icon-user',
    isActive: true,
    isExpanded: false,
  },
});

type TSubMenuItems = {
  [MenuItem in ESubMenuItem]: IMenuItem | IParentMenuItem;
};

export const SideBarSubMenuItems = (): TSubMenuItems => ({
  [ESubMenuItem.Scene]: {
    key: EMenuItemKey.Scene,
    target: 'BrowseOverlays',
    type: 'overlays',
    title: ESubMenuItem.Scene,
    trackingTarget: 'themes',
    isExpanded: false,
  },
  [ESubMenuItem.AlertBoxLibrary]: {
    key: EMenuItemKey.AlertBoxLibrary,
    target: 'AlertboxLibrary',
    title: ESubMenuItem.AlertBoxLibrary,
    trackingTarget: 'alertbox-library',
    isExpanded: false,
  },
  [ESubMenuItem.Widget]: {
    key: EMenuItemKey.Widget,
    target: 'BrowseOverlays',
    type: 'widget-theme',
    title: ESubMenuItem.Widget,
    trackingTarget: 'themes',
    isExpanded: false,
  },
  [ESubMenuItem.Sites]: {
    key: EMenuItemKey.Sites,
    target: 'BrowseOverlays',
    type: 'site-theme',
    title: ESubMenuItem.Sites,
    trackingTarget: 'themes',
    isActive: false,
    isExpanded: false,
  },
  [ESubMenuItem.AppsStoreHome]: {
    key: EMenuItemKey.AppsStoreHome,
    target: 'PlatformAppStore',
    title: ESubMenuItem.AppsStoreHome,
    trackingTarget: 'app-store',
    isExpanded: false,
  },
  [ESubMenuItem.AppsManager]: {
    key: EMenuItemKey.AppsManager,
    target: 'PlatformAppStore',
    title: ESubMenuItem.AppsManager,
    type: 'profile',
    trackingTarget: 'app-store',
    isExpanded: false,
  },
  [ESubMenuItem.DashboardHome]: {
    key: EMenuItemKey.DashboardHome,
    title: ESubMenuItem.DashboardHome,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.Cloudbot]: {
    key: EMenuItemKey.Cloudbot,
    type: 'cloudbot',
    title: ESubMenuItem.Cloudbot,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.AlertBoxSettings]: {
    key: EMenuItemKey.AlertBoxSettings,
    type: 'alertbox',
    title: ESubMenuItem.AlertBoxSettings,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.Widgets]: {
    key: EMenuItemKey.Widgets,
    type: 'widgets',
    title: ESubMenuItem.Widgets,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.TipSettings]: {
    key: EMenuItemKey.TipSettings,
    type: 'tipping',
    title: ESubMenuItem.TipSettings,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.Multistream]: {
    key: EMenuItemKey.Multistream,
    type: 'multistream',
    title: ESubMenuItem.Multistream,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
});
