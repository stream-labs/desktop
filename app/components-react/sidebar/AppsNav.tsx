import React from 'react';
import styles from './SideNav.m.less';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import MenuItem from 'components-react/shared/MenuItem';
import cx from 'classnames';

export default function AppsNav() {
  const { NavigationService, PlatformAppsService, SideNavService } = Services;

  const { currentMenuItem, setCurrentMenuItem, apps, isOpen, navigateApp } = useVuex(() => ({
    currentMenuItem: SideNavService.views.currentMenuItem,
    setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
    apps: SideNavService.views.apps,
    isOpen: SideNavService.views.isOpen,
    navigateApp: NavigationService.actions.navigateApp,
  }));

  function iconSrc(appId: string, path: string) {
    return PlatformAppsService.views.getAssetUrl(appId, path) || undefined;
  }

  return (
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
            >
              {app?.name}
            </MenuItem>
          ),
      )}
    </>
  );
}
