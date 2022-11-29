import React from 'react';
import styles from './SideNav.m.less';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import MenuItem from 'components-react/shared/MenuItem';
import { EAppPageSlot } from 'services/platform-apps';
import cx from 'classnames';
interface IAppsNav {
  type?: 'enabled' | 'selected';
}

export default function AppsNav(p: IAppsNav) {
  const { NavigationService, PlatformAppsService, SideNavService } = Services;
  const { type = 'selected' } = p;

  const { currentMenuItem, apps, isOpen, navigateApp, enabledApps } = useVuex(() => ({
    currentMenuItem: SideNavService.views.currentMenuItem,
    apps: SideNavService.views.apps,
    isOpen: SideNavService.views.isOpen,
    navigateApp: NavigationService.actions.navigateApp,
    enabledApps: PlatformAppsService.views.enabledApps
      .filter(app => {
        return !!app.manifest.pages.find(page => {
          return page.slot === EAppPageSlot.TopNav;
        });
      })
      .sort((a, b) => (a.manifest?.name > b.manifest?.name ? 1 : -1)),
  }));

  function iconSrc(appId: string, path: string) {
    return PlatformAppsService.views.getAssetUrl(appId, path) || undefined;
  }

  return type === 'selected' ? (
    <>
      {apps.map(
        app =>
          app &&
          app?.isActive && (
            <MenuItem
              key={app?.id}
              className={cx(
                !isOpen && styles.closed,
                isOpen && styles.open,
                currentMenuItem === app?.id && styles.active,
              )}
              title={app?.name}
              icon={
                app?.icon && app?.id ? (
                  <img src={iconSrc(app?.id, app?.icon)} className={styles.appIcons} />
                ) : (
                  <i className="icon-integrations" />
                )
              }
              onClick={() => app?.id && navigateApp(app?.id)}
              type="app"
            >
              {app?.name}
            </MenuItem>
          ),
      )}
    </>
  ) : (
    <>
      {enabledApps.map(
        app =>
          app && (
            <MenuItem
              key={`sub-${app?.id}`}
              className={cx(
                styles.appMenuItem,
                currentMenuItem === `sub-${app?.id}` && styles.active,
              )}
              title={app.manifest?.name}
              onClick={() => app?.id && navigateApp(app?.id, `sub-${app?.id}`)}
              type="submenu"
            >
              {app.manifest?.name}
            </MenuItem>
          ),
      )}
    </>
  );
}
