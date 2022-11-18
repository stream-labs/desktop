import React, { useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';
import styles from './NavTools.m.less';
import * as remote from '@electron/remote';
import { Badge, Button, Form, Menu, Modal } from 'antd';
import {
  EMenuItem,
  EMenuItemKey,
  ENavName,
  IMenuItem,
  IParentMenuItem,
  menuTitles,
} from 'services/side-nav';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import SubMenu from 'components-react/shared/SubMenu';

export default function SideNav() {
  const {
    UserService,
    SettingsService,
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
    updateStyleBlockers,
  } = useVuex(
    () => ({
      isLoggedIn: UserService.views.isLoggedIn,
      isPrime: UserService.views.isPrime,
      platform: UserService.views.auth?.platforms[UserService.views.auth?.primaryPlatform],
      menuItems: SideNavService.views.state[ENavName.BottomNav].menuItems,
      isOpen: SideNavService.views.isOpen,
      openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.BottomNav),
      expandMenuItem: SideNavService.actions.expandMenuItem,
      updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
    }),
    false,
  );

  const [dashboardOpening, setDashboardOpening] = useState(false);
  const [showModal, setShowModal] = useState(false);

  function openSettingsWindow() {
    UsageStatisticsService.actions.recordClick('SideNav2', 'settings');
    SettingsService.actions.showSettings();
  }

  function openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  async function openDashboard(page?: string) {
    UsageStatisticsService.actions.recordClick('SideNav2', page || 'dashboard');
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
    UsageStatisticsService.actions.recordClick('SideNav2', 'help');
    remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  async function upgradeToPrime() {
    UsageStatisticsService.actions.recordClick('SideNav2', 'prime');
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
      UserService.actions.logOut();
    } else {
      WindowsService.actions.closeChildWindow();
      UserService.actions.showLogin();
    }
  };

  const handleShowModal = (status: boolean) => {
    updateStyleBlockers('main', status);
    setShowModal(status);
  };

  return (
    <>
      <Menu
        key={ENavName.BottomNav}
        forceSubMenuRender
        mode="inline"
        className={cx(styles.bottomNav, !isOpen && styles.closed, isOpen && styles.open)}
        defaultOpenKeys={openMenuItems && openMenuItems}
        getPopupContainer={triggerNode => triggerNode}
      >
        {menuItems.map((menuItem: IParentMenuItem) => {
          if (isDevMode && menuItem.title === EMenuItem.DevTools) {
            return (
              <Menu.Item
                key={menuItem.key}
                title={menuItem.title}
                icon={<i className="icon-developer" />}
                onClick={openDevTools}
              >
                {menuItem.title}
              </Menu.Item>
            );
          } else if (isLoggedIn && !isPrime && menuItem.title === EMenuItem.GetPrime) {
            return (
              <Menu.Item
                key={menuItem.key}
                title={menuTitles(menuItem.title)}
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
                {menuTitles(menuItem.title)}
              </Menu.Item>
            );
          } else if (isLoggedIn && menuItem.title === EMenuItem.Dashboard) {
            return (
              <SubMenu
                key={menuItem.key}
                title={menuTitles(menuItem.title)}
                icon={
                  <div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                      <i className={menuItem.icon} />
                    </Badge>
                  </div>
                }
                onTitleClick={() => {
                  !isOpen && throttledOpenDashboard();
                  expandMenuItem(ENavName.BottomNav, menuItem.key as EMenuItemKey);
                }}
                applystyles={+isOpen}
              >
                {menuItem?.subMenuItems.map((subMenuItem: IMenuItem) => (
                  <Menu.Item
                    key={subMenuItem.key}
                    title={menuTitles(subMenuItem.title)}
                    onClick={() => throttledOpenDashboard(subMenuItem?.type)}
                  >
                    {menuTitles(subMenuItem.title)}
                  </Menu.Item>
                ))}
              </SubMenu>
            );
          } else if (menuItem.title === EMenuItem.GetHelp) {
            return (
              <Menu.Item
                key={menuItem.key}
                title={menuTitles(menuItem.title)}
                icon={
                  <div>
                    <Badge count={<i className={cx('icon-pop-out-3', styles.linkBadge)} />}>
                      <i className={menuItem?.icon} />
                    </Badge>
                  </div>
                }
                onClick={() => openHelp()}
              >
                {menuTitles(menuItem.title)}
              </Menu.Item>
            );
          } else if (menuItem.title === EMenuItem.Settings) {
            return (
              <Menu.Item
                key={menuItem.key}
                title={menuTitles(menuItem.title)}
                icon={<i className={menuItem?.icon} />}
                onClick={openSettingsWindow}
              >
                {menuTitles(menuItem.title)}
              </Menu.Item>
            );
          } else if (menuItem.title === EMenuItem.Login) {
            return (
              <Menu.Item
                key={menuItem.key}
                title={!isLoggedIn ? menuTitles(menuItem.title) : $t('Log Out')}
                className={cx(styles.login, !isOpen && styles.loginClosed)}
                icon={!isOpen && <i className="icon-user" />}
                onClick={() => (isLoggedIn ? handleShowModal(true) : handleAuth())}
              >
                {!isLoggedIn ? (
                  <span className={styles.loggedOut}>{menuTitles(menuItem.title)}</span>
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
                      <span className={styles.username}>{platform?.username || $t('Log Out')}</span>
                      <i className={cx('icon-logout', styles.loginArrow)} />
                    </>
                  )
                )}
              </Menu.Item>
            );
          }
        })}
      </Menu>
      <LogoutModal
        showModal={showModal}
        handleAuth={handleAuth}
        handleShowModal={handleShowModal}
      />
    </>
  );
}

function LogoutModal(p: {
  showModal: boolean;
  handleAuth: () => void;
  handleShowModal: (status: boolean) => void;
}) {
  return (
    <Modal
      footer={null}
      visible={p.showModal}
      onCancel={() => p.handleShowModal(false)}
      getContainer={false}
      className={styles.confirmLogout}
    >
      <Form className={styles.confirmLogout}>
        <h2>{$t('Confirm')}</h2>
        {$t('Are you sure you want to log out?')}
        <div className={styles.buttons}>
          <Button onClick={() => p.handleAuth()}>{$t('Yes')}</Button>
          <Button onClick={() => p.handleShowModal(false)}>{$t('No')}</Button>
        </div>
      </Form>
    </Modal>
  );
}
