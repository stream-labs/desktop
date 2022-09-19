import { IMenu, IMenuItem } from './menu';
import { $t } from 'services/i18n';

const AlertBoxLibrary = (): IMenuItem => ({
  target: 'AlertboxLibrary',
  title: $t('Alert Box'),
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
      title: $t('Editor'),
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
      title: $t('Layout Editor'),
      trackingTarget: 'layout-editor',
      icon: 'fas fa-th-large',
      isActive: false,
      isLegacy: true,
    },
    {
      // target: '', this toggles studio mode
      title: $t('Studio Mode'),
      trackingTarget: 'studio-mode',
      icon: 'icon-studio-mode-3',
      isActive: false,
      isLegacy: true,
      isToggled: false, // toggles
    },
    {
      target: 'BrowseOverlays',
      title: $t('Themes'),
      trackingTarget: 'themes', // maybe required?
      isActive: false, // maybe track in MenuStatus
      icon: 'icon-themes',
      isExpanded: false,
      subMenuItems: [
        {
          target: 'BrowseOverlays', // to the scene tab
          title: $t('Scene'),
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
        AlertBoxLibrary(),
        {
          // target: 'Widget', TODO: where does this go?
          title: $t('Widget'),
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
        {
          // target: 'Tip Page', TODO: where does this go?
          title: $t('Tip Page'),
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
      ],
    },
    {
      target: 'PlatformAppStore',
      title: $t('App Store'),
      trackingTarget: 'app-store',
      icon: 'icon-store',
      isActive: false,
      isExpanded: false,
      subMenuItems: [
        {
          target: 'PlatformAppMainPage', // to the My Apps tab in Profile?
          title: $t('Apps Manager'),
          // trackingTarget?: 'themes', // maybe required?
          isActive: false, // maybe track in MenuStatus
        },
        // apps here. ...enabledApps.map(app => app.id)]
      ],
    },
    {
      target: 'Highlighter',
      svgIcon: true, // TODO: Convert to font icon, then delete property
      title: $t('Highlighter'),
      trackingTarget: 'highlighter',
      isActive: false,
    },
    {
      target: 'ThemeAudit',
      icon: 'fas fa-exclamation-triangle',
      title: $t('Theme Audit'),
      trackingTarget: 'themeaudit',
      isActive: false,
    },
  ],
});
