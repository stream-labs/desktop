import { TAppPage } from 'services/navigation';

type TExternalLinks = 'cloudbot' | 'alertbox' | 'widgets' | 'tipping' | 'multistream';

export interface IAppMenuItem {
  id?: string;
  name?: string;
  isActive: boolean;
  icon?: string;
  index: number;
}
export interface IMenu {
  name: string;
  isLegacy?: boolean; // users created after sidebar navigation refactor will see fewer menu items
  menuItems: (IMenuItem | IParentMenuItem)[];
}

export interface IMenuItem {
  target?: TAppPage | 'NavTools' | 'WidgetWindow' | TExternalLinks; // optional because menu item could be a toggle
  title: string;
  trackingTarget?: string;
  icon?: string;
  isLegacy?: boolean;
  isExpanded: boolean;
  isActive?: boolean;
  type?: string;
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
  isLegacy: true, // TODO: update to be set by user creation date
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
  isLegacy: true, // TODO: update to be set by user creation date
  menuItems: [
    SideNavMenuItems()[EMenuItem.DevTools],
    SideNavMenuItems()[EMenuItem.GetPrime],
    SideNavMenuItems()[EMenuItem.Dashboard],
    SideNavMenuItems()[EMenuItem.GetHelp],
    SideNavMenuItems()[EMenuItem.Settings],
    SideNavMenuItems()[EMenuItem.Login],
  ],
});

export type TNavMenu = {
  [Nav in ENavName]: IMenu;
};

export const SideNavMenu = (): TNavMenu => ({
  [ENavName.TopNav]: SideBarTopNavData(),
  [ENavName.BottomNav]: SideBarBottomNavData(),
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
  },
  [EMenuItem.LayoutEditor]: {
    target: 'LayoutEditor',
    title: EMenuItem.LayoutEditor,
    trackingTarget: 'layout-editor',
    icon: 'fas fa-th-large',
    isLegacy: true,
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.StudioMode]: {
    title: EMenuItem.StudioMode,
    icon: 'icon-studio-mode-3',
    isLegacy: true,
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Themes]: {
    target: 'BrowseOverlays',
    title: EMenuItem.Themes,
    trackingTarget: 'themes',
    icon: 'icon-themes',
    subMenuItems: [
      SideBarSubMenuItems()[ESubMenuItem.Scene],
      SideBarSubMenuItems()[ESubMenuItem.AlertBox],
      SideBarSubMenuItems()[ESubMenuItem.Widget],
      SideBarSubMenuItems()[ESubMenuItem.TipPage],
    ],
    isActive: true,
    isExpanded: false,
  },

  [EMenuItem.AppStore]: {
    target: 'PlatformAppStore',
    title: EMenuItem.AppStore,
    trackingTarget: 'app-store',
    icon: 'icon-store',
    subMenuItems: [SideBarSubMenuItems()[ESubMenuItem.AppsManager]],
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Highlighter]: {
    target: 'Highlighter',
    icon: 'icon-highlighter',
    title: EMenuItem.Highlighter,
    trackingTarget: 'highlighter',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.ThemeAudit]: {
    target: 'ThemeAudit',
    icon: 'fas fa-exclamation-triangle',
    title: EMenuItem.ThemeAudit,
    trackingTarget: 'themeaudit',
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.DevTools]: {
    title: EMenuItem.DevTools,
    trackingTarget: 'editor',
    icon: 'icon-developer',
    isLegacy: false,
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.GetPrime]: {
    title: EMenuItem.GetPrime,
    icon: 'icon-prime',
    isLegacy: false,
    isActive: true,
    isExpanded: false,
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
    isExpanded: false,
  },
  [EMenuItem.GetHelp]: {
    title: EMenuItem.GetHelp,
    icon: 'icon-question',
    isLegacy: false,
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Settings]: {
    title: EMenuItem.Settings,
    icon: 'icon-settings',
    isLegacy: false,
    isActive: true,
    isExpanded: false,
  },
  [EMenuItem.Login]: {
    title: EMenuItem.Login,
    icon: 'icon-user',
    isLegacy: false,
    isActive: true,
    isExpanded: false,
  },
});

type TSubMenuItems = {
  [MenuItem in ESubMenuItem]: IMenuItem | IParentMenuItem;
};

export const SideBarSubMenuItems = (): TSubMenuItems => ({
  [ESubMenuItem.Scene]: {
    target: 'BrowseOverlays',
    type: 'overlays',
    title: ESubMenuItem.Scene,
    isExpanded: false,
  },
  [ESubMenuItem.Widget]: {
    target: 'BrowseOverlays',
    type: 'widget-themes',
    title: ESubMenuItem.Widget,
    isExpanded: false,
  },
  [ESubMenuItem.TipPage]: {
    // target: '', // TODO: add target once tip page is merged
    title: ESubMenuItem.TipPage,
    isActive: false,
    isExpanded: false,
  },
  [ESubMenuItem.AppsManager]: {
    target: 'PlatformAppStore', // TODO: direct to the My Apps tab in Profile
    title: ESubMenuItem.AppsManager,
    // type: 'store/list/installed', // path store/list/installed in web nav
    trackingTarget: 'app-store',
    isExpanded: false,
  },
  [ESubMenuItem.Cloudbot]: {
    target: 'cloudbot',
    title: ESubMenuItem.Cloudbot,
    isLegacy: false,
    isExpanded: false,
  },
  [ESubMenuItem.AlertBox]: {
    target: 'AlertboxLibrary',
    title: ESubMenuItem.AlertBox,
    trackingTarget: 'alertbox-library',
    isExpanded: false,
  },
  [ESubMenuItem.Widgets]: {
    target: 'widgets',
    title: ESubMenuItem.Widgets,
    isExpanded: false,
  },
  [ESubMenuItem.TipSettings]: {
    target: 'tipping',
    title: ESubMenuItem.TipSettings,
    isExpanded: false,
  },
  [ESubMenuItem.Multistream]: {
    target: 'multistream',
    title: ESubMenuItem.Multistream,
    isExpanded: false,
  },
});
