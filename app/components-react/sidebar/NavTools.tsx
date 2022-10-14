import React, { useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import { EDismissable } from 'services/dismissables';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';
import styles from './NavTools.m.less';
import * as remote from '@electron/remote';
import { Badge, Menu, Typography, Divider } from 'antd';
import { EMenuItem, ENavName, IMenuItem, IParentMenuItem } from 'services/side-nav';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import HelpTip from 'components-react/shared/HelpTip';

export default function SideNav() {
  const {
    UserService,
    SettingsService,
    NavigationService,
    MagicLinkService,
    UsageStatisticsService,
    SideNavService,
    WindowsService,
  } = Services;

  const isDevMode = Utils.isDevMode();

  const {
    isLoggedIn,
    isPrime,
    platform,
    menuItems,
    isOpen,
    openMenuItems,
    expandMenuItem,
    currentPage,
  } = useVuex(
    () => ({
      isLoggedIn: UserService.views.isLoggedIn,
      isPrime: UserService.views.isPrime,
      platform: UserService.views.auth?.platforms[UserService.views.auth?.primaryPlatform],
      menuItems: SideNavService.views.state[ENavName.BottomNav].menuItems,
      isOpen: SideNavService.views.isOpen,
      openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.TopNav),
      expandMenuItem: SideNavService.actions.expandMenuItem,
      currentPage: NavigationService.state.currentPage,
    }),
    false,
  );

  const [dashboardOpening, setDashboardOpening] = useState(false);

  function openSettingsWindow() {
    UsageStatisticsService.actions.recordClick('NavTools', 'settings');
    SettingsService.actions.showSettings();
  }

  function openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  async function openDashboard(page?: string) {
    UsageStatisticsService.actions.recordClick('NavTools', page || 'dashboard');
    if (dashboardOpening) return;
    setDashboardOpening(true);

    try {
      const link = await MagicLinkService.getDashboardMagicLink(page);
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }

    setDashboardOpening(false);
  }

  const throttledOpenDashboard = throttle(openDashboard, 2000, { trailing: false });

  function openHelp() {
    UsageStatisticsService.actions.recordClick('NavTools', 'help');
    remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  async function upgradeToPrime() {
    UsageStatisticsService.actions.recordClick('NavTools', 'prime');
    try {
      const link = await MagicLinkService.getDashboardMagicLink(
        'prime-marketing',
        'slobs-side-nav',
      );
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  const handleAuth = () => {
    if (isLoggedIn) {
      remote.dialog
        .showMessageBox({
          title: $t('Confirm'),
          message: $t('Are you sure you want to log out?'),
          buttons: [$t('Yes'), $t('No')],
        })
        .then(({ response }) => {
          if (response === 0) {
            UserService.actions.logOut();
          }
        });
    } else {
      WindowsService.actions.closeChildWindow();
      UserService.actions.showLogin();
    }
  };

  return (
    <Menu
      key={ENavName.BottomNav}
      forceSubMenuRender
      mode="inline"
      className={cx(styles.bottomNav, !isOpen && styles.closed)}
      defaultOpenKeys={openMenuItems && openMenuItems}
    >
      <Divider key="divider-1" className={styles.divider} />
      {isDevMode && (
        <Menu.Item
          key={'dev-tools'}
          title={EMenuItem.DevTools}
          icon={<i className="icon-developer" />}
          onClick={openDevTools}
        >
          {EMenuItem.DevTools}
        </Menu.Item>
      )}

      {menuItems.map((menuItem: IParentMenuItem) => (
        <>
          {isLoggedIn && !isPrime && menuItem.title === EMenuItem.GetPrime && (
            <Menu.Item
              key={menuItem.key}
              title={$t(menuItem.title)}
              icon={
                <div>
                  <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                    <i className={menuItem.icon} />
                  </Badge>
                </div>
              }
              onClick={upgradeToPrime}
              className={styles.badgeScale}
            >
              <>{$t(menuItem.title)}</>
            </Menu.Item>
          )}
          {isLoggedIn && isPrime && menuItem.title === EMenuItem.Dashboard && (
            <Menu.SubMenu
              key={menuItem.key}
              title={$t(menuItem.title)}
              icon={
                <div>
                  <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                    <i className={menuItem.icon} />
                  </Badge>
                </div>
              }
              onTitleClick={() => {
                !isOpen && throttledOpenDashboard();
                expandMenuItem(ENavName.BottomNav, menuItem.title as EMenuItem);
              }}
              className={styles.badgeScale}
            >
              {menuItem?.subMenuItems.map((subMenuItem: IMenuItem) => (
                <Menu.Item
                  key={subMenuItem.key}
                  title={$t(subMenuItem.title)}
                  onClick={() => throttledOpenDashboard(subMenuItem?.target)}
                >
                  {$t(subMenuItem.title)}
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          )}
          {menuItem.title === EMenuItem.GetHelp && (
            <Menu.Item
              key={menuItem.key}
              title={$t(menuItem.title)}
              icon={
                <div>
                  <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                    <i className={menuItem?.icon} />
                  </Badge>
                </div>
              }
              onClick={() => openHelp()}
            >
              {$t(menuItem.title)}
            </Menu.Item>
          )}
          {menuItem.title === EMenuItem.Settings && (
            <Menu.Item
              key={menuItem.key}
              title={$t(menuItem.title)}
              icon={<i className={menuItem?.icon} />}
              onClick={openSettingsWindow}
            >
              {$t(EMenuItem.Settings)}
            </Menu.Item>
          )}
          {menuItem.title === EMenuItem.Login && (
            <>
              <Divider key="divider-2" className={styles.loginDivider} />
              <Menu.Item
                key={menuItem.key}
                title={!isLoggedIn ? $t(EMenuItem.Login) : $t('Log Out')}
                className={styles.login}
                icon={!isOpen && <i className="icon-user" />}
                onClick={() => handleAuth()}
              >
                {!isLoggedIn ? (
                  <Typography.Text underline style={{ marginBottom: '0px', flexGrow: 1 }}>
                    {$t(EMenuItem.Login)}
                  </Typography.Text>
                ) : (
                  isOpen && (
                    <>
                      {platform && (
                        <PlatformLogo
                          platform={platform?.type!}
                          className={cx(
                            styles.platformLogo,
                            styles[`platform-logo-${platform?.type ?? 'default'}`],
                          )}
                        />
                      )}
                      <Typography.Text className={styles.username}>
                        {platform?.username || $t('Log Out')}
                      </Typography.Text>
                      <i className={cx('icon-logout', styles.loginArrow)} />
                    </>
                  )
                )}
              </Menu.Item>
            </>
          )}
        </>
      ))}
    </Menu>
  );
}
