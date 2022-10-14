import { TAppPage } from 'services/navigation';

type TExternalLinkParam =
  | 'overlay'
  | 'widget-theme'
  | 'site-theme'
  | 'cloudbot'
  | 'alertbox'
  | 'widgets'
  | 'tipping'
  | 'multistream';

type TSideNavItem = TAppPage | TExternalLinkParam | 'NavTools' | 'WidgetWindow' | string;

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
  type?: TExternalLinkParam | string;
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
  AlertBoxLibrary = 'Alert Box',
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
    key: EMenuItem.Editor,
    target: 'Studio',
    title: EMenuItem.Editor,
    trackingTarget: 'editor',
    icon: 'icon-studio',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.LayoutEditor]: {
    key: EMenuItem.LayoutEditor,
    target: 'LayoutEditor',
    title: EMenuItem.LayoutEditor,
    trackingTarget: 'layout-editor',
    icon: 'fas fa-th-large',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.StudioMode]: {
    key: EMenuItem.StudioMode,
    title: EMenuItem.StudioMode,
    icon: 'icon-studio-mode-3',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Themes]: {
    key: EMenuItem.Themes,
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
    key: EMenuItem.AppStore,
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
    key: EMenuItem.Highlighter,
    target: 'Highlighter',
    icon: 'icon-highlighter',
    title: EMenuItem.Highlighter,
    trackingTarget: 'highlighter',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.ThemeAudit]: {
    key: EMenuItem.ThemeAudit,
    target: 'ThemeAudit',
    icon: 'fas fa-exclamation-triangle',
    title: EMenuItem.ThemeAudit,
    trackingTarget: 'themeaudit',
    isActive: true, // showing/hiding is handled in the SideNav component
    isExpanded: false,
  },
  [EMenuItem.DevTools]: {
    key: EMenuItem.DevTools,
    title: EMenuItem.DevTools,
    trackingTarget: 'editor',
    icon: 'icon-developer',
    isActive: true, // showing/hiding is handled in the SideNav component
    isExpanded: false,
  },
  [EMenuItem.GetPrime]: {
    key: EMenuItem.GetPrime,
    title: EMenuItem.GetPrime,
    icon: 'icon-prime',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Dashboard]: {
    key: EMenuItem.Dashboard,
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
    key: EMenuItem.GetHelp,
    title: EMenuItem.GetHelp,
    icon: 'icon-question',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Settings]: {
    key: EMenuItem.Settings,
    title: EMenuItem.Settings,
    icon: 'icon-settings',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Login]: {
    key: EMenuItem.Login,
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
    key: ESubMenuItem.Scene,
    target: 'BrowseOverlays',
    type: 'overlays',
    title: ESubMenuItem.Scene,
    trackingTarget: 'themes',
    isExpanded: false,
  },
  [ESubMenuItem.AlertBoxLibrary]: {
    key: `${ESubMenuItem.AlertBoxLibrary} Library`,
    target: 'AlertboxLibrary',
    title: ESubMenuItem.AlertBoxLibrary,
    trackingTarget: 'alertbox-library',
    isExpanded: false,
  },
  [ESubMenuItem.Widget]: {
    key: ESubMenuItem.Widget,
    target: 'BrowseOverlays',
    type: 'widget-theme',
    title: ESubMenuItem.Widget,
    trackingTarget: 'themes',
    isExpanded: false,
  },
  [ESubMenuItem.Sites]: {
    key: ESubMenuItem.Sites,
    target: 'BrowseOverlays',
    type: 'site-theme',
    title: ESubMenuItem.Sites,
    trackingTarget: 'themes',
    isActive: false,
    isExpanded: false,
  },
  [ESubMenuItem.AppsStoreHome]: {
    key: ESubMenuItem.AppsStoreHome,
    target: 'PlatformAppStore',
    title: ESubMenuItem.AppsStoreHome,
    trackingTarget: 'app-store',
    isExpanded: false,
  },
  [ESubMenuItem.AppsManager]: {
    key: ESubMenuItem.AppsManager,
    target: 'PlatformAppStore',
    title: ESubMenuItem.AppsManager,
    type: 'profile',
    trackingTarget: 'app-store',
    isExpanded: false,
  },
  [ESubMenuItem.DashboardHome]: {
    key: ESubMenuItem.DashboardHome,
    title: ESubMenuItem.DashboardHome,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.Cloudbot]: {
    key: ESubMenuItem.Cloudbot,
    target: 'cloudbot',
    title: ESubMenuItem.Cloudbot,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.AlertBoxSettings]: {
    key: ESubMenuItem.AlertBoxSettings,
    target: 'alertbox',
    title: ESubMenuItem.AlertBoxSettings,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.Widgets]: {
    key: ESubMenuItem.Widgets,
    target: 'widgets',
    title: ESubMenuItem.Widgets,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.TipSettings]: {
    key: ESubMenuItem.TipSettings,
    target: 'tipping',
    title: ESubMenuItem.TipSettings,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
  [ESubMenuItem.Multistream]: {
    key: ESubMenuItem.Multistream,
    target: 'multistream',
    title: ESubMenuItem.Multistream,
    trackingTarget: 'dashboard',
    isExpanded: false,
  },
});
