import { IMenu, IMenuItem } from './menu';

const AlertBoxLibrary = (): IMenuItem => ({
  target: 'AlertboxLibrary',
  title: 'Alert Box',
  trackingTarget: 'alertbox-library',
  icon: 'icon-alert-box',
  isActive: false,
  isLegacy: true,
});

export const SideBarTopNavData = (): IMenu => ({
  name: 'top-nav',
  isOpen: false, // TODO: update to be set by user settings on layout load
  isLegacy: true, // TODO: update to be set by user creation date
  menuItems: [
    {
      target: 'Studio',
      title: 'Editor',
      trackingTarget: 'editor',
      icon: 'icon-studio',
      isLegacy: false,
      isActive: true,
      isExpanded: false,
      isEditor: true, // if true, will show themes in bar when minimized
      // if the user has themes, they will be listed in a subMenuItems property. The trackingTarget is 'custom' e.g: tab === 'default' ? 'editor' : 'custom'
    },
    AlertBoxLibrary(),
    {
      target: 'LayoutEditor',
      title: 'Layout Editor',
      trackingTarget: 'layout-editor',
      icon: 'fas fa-th-large',
      isActive: false,
      isLegacy: true,
    },
    {
      // target: '', this toggles studio mode
      title: 'Studio Mode',
      trackingTarget: 'studio-mode',
      icon: 'icon-studio-mode-3',
      isActive: false,
      isLegacy: true,
      isToggled: false, // toggles
    },
    {
      target: 'BrowseOverlays',
      title: 'Themes',
      trackingTarget: 'themes', // maybe required?
      isActive: false, // maybe track in MenuStatus
      icon: 'icon-themes',
      isExpanded: false,
      subMenuItems: [
        {
          target: 'BrowseOverlays', // to the scene tab
          title: 'Scene',
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
        AlertBoxLibrary(),
        {
          // target: 'Widget', TODO: where does this go?
          title: 'Widget',
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
        {
          // target: 'Tip Page', TODO: where does this go?
          title: 'Tip Page',
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
      ],
    },
    {
      target: 'PlatformAppStore',
      title: 'App Store',
      trackingTarget: 'app-store',
      icon: 'icon-store',
      isActive: false,
      isExpanded: false,
      subMenuItems: [
        {
          target: 'PlatformAppMainPage', // to the My Apps tab in Profile?
          title: 'Apps Manager',
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
        // apps here. ...enabledApps.map(app => app.id)]
      ],
    },
    {
      target: 'Highlighter',
      icon: 'icon-highlighter',
      title: 'Highlighter',
      trackingTarget: 'highlighter',
      isActive: false,
    },
    {
      target: 'ThemeAudit',
      icon: 'fas fa-exclamation-triangle',
      title: 'Theme Audit',
      trackingTarget: 'themeaudit',
      isActive: false,
    },
  ],
});

export const SideBarBottomNavData = (): IMenu => ({
  name: 'bottom-nav',
  isOpen: false, // TODO: update to be set by user settings on layout load
  isLegacy: true, // TODO: update to be set by user creation date
  menuItems: [
    {
      title: 'Dev Tools',
      trackingTarget: 'editor',
      icon: 'icon-developer',
      isLegacy: false,
      isActive: true,
    },
    {
      title: 'Get Prime',
      icon: 'icon-prime',
      isLegacy: false,
      isActive: true,
    },
    {
      title: 'Dashboard',
      icon: 'icon-dashboard',
      isLegacy: false,
      isActive: true,
      subMenuItems: [
        {
          title: 'Cloudbot',
          isLegacy: false,
          isActive: true,
        },
        {
          title: 'Alert Box',
          isLegacy: false,
          isActive: true,
        },
        {
          title: 'Widgets',
          isLegacy: false,
          isActive: true,
        },
        {
          title: 'Tip Settings',
          isLegacy: false,
          isActive: true,
        },
        {
          title: 'Multistream',
          isLegacy: false,
          isActive: true,
        },
      ],
    },
    {
      title: 'Get Help',
      icon: 'icon-question',
      isLegacy: false,
      isActive: true,
    },
    {
      title: 'Settings',
      icon: 'icon-settings',
      isLegacy: false,
      isActive: true,
    },
  ],
});

export const Login: IMenu = {
  name: 'login',
  isOpen: false,
  isLegacy: true,
  menuItems: [
    {
      title: 'Login',
      icon: 'icon-user',
      isLegacy: false,
      isActive: true,
    },
  ],
};
