import React, { useLayoutEffect, useRef, useMemo } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import cx from 'classnames';
import { TAppPage } from 'services/navigation';
import {
  ENavName,
  EMenuItemKey,
  EMenuItem,
  IMenuItem,
  IParentMenuItem,
  TExternalLinkType,
  menuTitles,
} from 'services/side-nav';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { EAppPageSlot } from 'services/platform-apps';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import NavTools from './NavTools';
import styles from './SideNav.m.less';
import { Menu, Layout, Button } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import HelpTip from 'components-react/shared/HelpTip';
import NewBadge from 'components-react/shared/NewBadge';
import SubMenu from 'components-react/shared/SubMenu';
import { EDismissable } from 'services/dismissables';

const { Sider } = Layout;

export default function SideNav() {
  const {
    CustomizationService,
    NavigationService,
    UserService,
    PlatformAppsService,
    IncrementalRolloutService,
    UsageStatisticsService,
    SideNavService,
    LayoutService,
    TransitionsService,
    WindowsService,
    DismissablesService,
  } = Services;

  function navigate(page: TAppPage, trackingTarget?: string, type?: TExternalLinkType | string) {
    if (!UserService.views.isLoggedIn && page !== 'Studio') return;

    if (trackingTarget) {
      UsageStatisticsService.actions.recordClick('SideNav2', trackingTarget);
    }

    if (type) {
      NavigationService.actions.navigate(page, { type });
    } else {
      NavigationService.actions.navigate(page);
    }
  }

  function navigateApp(appId: string, key?: string) {
    NavigationService.actions.navigate('PlatformAppMainPage', { appId });
    setCurrentMenuItem(key ?? appId);
  }

  function navigateToStudioTab(tabId: string, trackingTarget: string, key: string) {
    if (currentMenuItem !== key) {
      NavigationService.actions.navigate('Studio', { trackingTarget });
      LayoutService.actions.setCurrentTab(tabId);
      setCurrentMenuItem(key);
    }
  }

  function iconSrc(appId: string, path: string) {
    return PlatformAppsService.views.getAssetUrl(appId, path) || undefined;
  }

  function toggleStudioMode() {
    UsageStatisticsService.actions.recordClick('NavTools', 'studio-mode');
    if (studioMode) {
      TransitionsService.actions.disableStudioMode();
    } else {
      TransitionsService.actions.enableStudioMode();
    }
  }

  function updateSubMenu() {
    // when opening/closing the navbar swap the submenu current menu item
    // to correctly display selected color
    const subMenuItems = {
      [EMenuItemKey.Themes]: EMenuItemKey.Scene,
      [EMenuItemKey.Scene]: EMenuItemKey.Themes,
      [EMenuItemKey.AppStore]: EMenuItemKey.AppsStoreHome,
      [EMenuItemKey.AppsStoreHome]: EMenuItemKey.AppStore,
    };
    if (Object.keys(subMenuItems).includes(currentMenuItem as EMenuItemKey)) {
      setCurrentMenuItem(subMenuItems[currentMenuItem]);
    }
  }

  function handleNavigation(menuItem: IMenuItem, key?: string) {
    if (menuItem.title === EMenuItem.StudioMode) {
      // if studio mode, toggle studio mode
      toggleStudioMode();
      return;
    } else if (menuItem?.target && menuItem?.type) {
      navigate(menuItem?.target as TAppPage, menuItem?.trackingTarget, menuItem?.type);
    } else if (menuItem?.target) {
      navigate(menuItem?.target as TAppPage, menuItem?.trackingTarget);
    }
    setCurrentMenuItem(key ?? menuItem.key);
  }

  const {
    featureIsEnabled,
    currentMenuItem,
    setCurrentMenuItem,
    tabs,
    currentTab,
    leftDock,
    apps,
    enabledApps,
    loggedIn,
    menu,
    compactView,
    isOpen,
    toggleMenuStatus,
    openMenuItems,
    expandMenuItem,
    studioMode,
    showCustomEditor,
    updateStyleBlockers,
    dismiss,
    showNewBadge,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    currentMenuItem: SideNavService.views.currentMenuItem,
    setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
    tabs: LayoutService.state.tabs,
    currentTab: LayoutService.views.currentTab,
    leftDock: CustomizationService.state.leftDock,
    apps: SideNavService.views.apps,
    enabledApps: PlatformAppsService.views.enabledApps
      .filter(app => {
        return !!app.manifest.pages.find(page => {
          return page.slot === EAppPageSlot.TopNav;
        });
      })
      .sort((a, b) => (a.manifest?.name > b.manifest?.name ? 1 : -1)),
    loggedIn: UserService.views.isLoggedIn,
    menu: SideNavService.views.state[ENavName.TopNav],
    compactView: SideNavService.views.compactView,
    isOpen: SideNavService.views.isOpen,
    toggleMenuStatus: SideNavService.actions.toggleMenuStatus,
    openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.TopNav),
    expandMenuItem: SideNavService.actions.expandMenuItem,
    studioMode: TransitionsService.views.studioMode,
    showCustomEditor: SideNavService.views.showCustomEditor,
    updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
    dismiss: DismissablesService.actions.dismiss,
    showNewBadge:
      DismissablesService.views.shouldShow(EDismissable.NewSideNav) &&
      SideNavService.views.hasLegacyMenu,
  }));

  const sider = useRef<HTMLDivElement | null>(null);

  const siderMinWidth: number = 50;
  const siderMaxWidth: number = 200;

  const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    entries.forEach((entry: ResizeObserverEntry) => {
      const width = Math.floor(entry?.contentRect?.width);

      if (width === siderMinWidth || width === siderMaxWidth) {
        updateStyleBlockers('main', false);
      }
    });
  });

  useLayoutEffect(() => {
    if (sider && sider?.current) {
      resizeObserver.observe(sider?.current);
    }
  }, [sider]);

  const menuItems = useMemo(() => {
    if (!loggedIn) {
      return menu.menuItems.filter(menuItem => menuItem.title === EMenuItem.Editor);
    }
    return !compactView
      ? menu.menuItems
      : menu.menuItems.filter((menuItem: IMenuItem) => {
          if (
            [
              EMenuItem.Editor,
              EMenuItem.Themes,
              EMenuItem.AppStore,
              EMenuItem.Highlighter,
            ].includes(menuItem.title as EMenuItem)
          ) {
            return menuItem;
          }
        });
  }, [compactView, menu, loggedIn]);

  const studioTabs = Object.keys(tabs).map((tab, i) => ({
    key: tab,
    target: tab,
    title: i === 0 || !tabs[tab].name ? menuTitles('Editor') : tabs[tab].name,
    icon: tabs[tab].icon,
    trackingTarget: tab === 'default' ? 'editor' : 'custom',
  }));

  /*
   * Theme audit will only ever be enabled on individual accounts or enabled
   * via command line flag. Not for general use.
   */
  const themeAuditEnabled = featureIsEnabled(EAvailableFeatures.themeAudit);

  return (
    <Layout hasSider className="side-nav">
      <Sider
        collapsible
        collapsed={!isOpen}
        trigger={null}
        className={cx(
          styles.sidenavSider,
          !isOpen && styles.siderClosed,
          !leftDock && styles.noLeftDock,
        )}
        ref={sider}
      >
        <Scrollable className={cx(styles.sidenavScroll)}>
          <Menu
            key={ENavName.TopNav}
            forceSubMenuRender
            mode="inline"
            className={cx(
              styles.topNav,
              isOpen && styles.open,
              !isOpen && styles.siderClosed && styles.closed,
            )}
            defaultOpenKeys={openMenuItems && openMenuItems}
            defaultSelectedKeys={[EMenuItem.Editor]}
            getPopupContainer={triggerNode => triggerNode}
          >
            {menuItems.map((menuItem: IParentMenuItem) => {
              if (
                !menuItem?.isActive ||
                (menuItem.title === EMenuItem.ThemeAudit && !themeAuditEnabled)
              ) {
                // skip inactive menu items
                // skip legacy menu items for new users
                // skip Theme Audit if not enabled
                return null;
              } else if (menuItem.title === EMenuItem.Editor && loggedIn && studioTabs.length > 1) {
                // if closed, show editor tabs in sidenav
                // which can be toggled to show or hide
                // otherwise, show editor tabs in submenu
                // don't translate tab title because the user has set it
                return showCustomEditor && !isOpen && !compactView ? (
                  studioTabs.map(tab => (
                    <Menu.Item
                      key={tab.key}
                      className={cx(
                        !isOpen && styles.closed,
                        (([EMenuItemKey.Editor as string, tab?.key, `sub-${tab?.key}`].includes(
                          currentMenuItem,
                        ) &&
                          currentTab === tabs[tab?.key]) ||
                          currentMenuItem === tab?.key) &&
                          styles.active,
                      )}
                      title={tab.title}
                      icon={<i className={tab.icon} />}
                      onClick={() => navigateToStudioTab(tab.target, tab.trackingTarget, tab.key)}
                    >
                      {tab.title}
                    </Menu.Item>
                  ))
                ) : (
                  <SubMenu
                    key={menuItem.key}
                    title={menuTitles(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onTitleClick={() => {
                      !isOpen &&
                        menuItem?.subMenuItems[0]?.target &&
                        handleNavigation(menuItem?.subMenuItems[0], menuItem.key);
                      expandMenuItem(ENavName.TopNav, menuItem.key as EMenuItemKey);
                    }}
                    className={cx(
                      !isOpen && styles.closed,
                      !isOpen && currentMenuItem === menuItem.key && styles.active,
                    )}
                    applystyles={+isOpen}
                  >
                    {studioTabs.map(tab => (
                      <Menu.Item
                        key={`sub-${tab.key}`}
                        className={cx(
                          (([EMenuItemKey.Editor as string, tab?.key, `sub-${tab?.key}`].includes(
                            currentMenuItem,
                          ) &&
                            currentTab === tabs[tab?.key]) ||
                            currentMenuItem === `sub-${tab?.key}`) &&
                            styles.active,
                        )}
                        title={tab.title}
                        icon={<i className={tab.icon} />}
                        onClick={() =>
                          navigateToStudioTab(tab.target, tab.trackingTarget, `sub-${tab.key}`)
                        }
                      >
                        {tab.title}
                      </Menu.Item>
                    ))}
                  </SubMenu>
                );
              } else {
                // otherwise, show a menu item or a menu item with a submenu
                return menuItem.hasOwnProperty('subMenuItems') ? (
                  <SubMenu
                    key={menuItem.key}
                    title={menuTitles(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onTitleClick={() => {
                      menuItem?.subMenuItems[0]?.target &&
                        !isOpen &&
                        handleNavigation(menuItem?.subMenuItems[0], menuItem.key);
                      expandMenuItem(ENavName.TopNav, menuItem.key as EMenuItemKey);
                    }}
                    className={cx(
                      !isOpen && styles.closed,
                      currentMenuItem === menuItem.key && styles.active,
                    )}
                    applystyles={+isOpen}
                  >
                    {menuItem?.subMenuItems?.map((subMenuItem: IMenuItem) => (
                      <Menu.Item
                        key={subMenuItem.key}
                        className={currentMenuItem === subMenuItem?.key && styles.active}
                        title={menuTitles(subMenuItem.title)}
                        onClick={() => handleNavigation(subMenuItem)}
                      >
                        {menuTitles(subMenuItem.title)}
                      </Menu.Item>
                    ))}
                    {menuItem.title === EMenuItem.AppStore &&
                      enabledApps.map(
                        app =>
                          app && (
                            <Menu.Item
                              key={app?.id}
                              className={cx(currentMenuItem === app?.id && styles.active)}
                              title={app.manifest?.name}
                              onClick={() => app?.id && navigateApp(app?.id)}
                            >
                              {app.manifest?.name}
                            </Menu.Item>
                          ),
                      )}
                  </SubMenu>
                ) : (
                  <Menu.Item
                    key={menuItem.key}
                    className={cx(
                      !isOpen && styles.closed,
                      menuItem.title === EMenuItem.StudioMode && studioMode && styles.studioMode,
                      currentMenuItem === menuItem.key && styles.active,
                    )}
                    title={menuTitles(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onClick={() => {
                      handleNavigation(menuItem);
                    }}
                  >
                    {menuTitles(menuItem.title)}
                  </Menu.Item>
                );
              }
            })}
            {loggedIn &&
              !compactView &&
              // apps shown in sidebar
              apps.map(
                app =>
                  app &&
                  app?.isActive && (
                    <Menu.Item
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
                    </Menu.Item>
                  ),
              )}
          </Menu>

          {/* show the bottom navigation menu */}
          <NavTools />
        </Scrollable>
        <HelpTip
          title={$t('Login')}
          dismissableKey={EDismissable.LoginPrompt}
          position={{ top: 'calc(100vh - 175px)', left: '80px' }}
          arrowPosition="bottom"
          style={{ position: 'absolute' }}
        >
          <div>
            {$t(
              'Gain access to additional features by logging in with your preferred streaming platform.',
            )}
          </div>
        </HelpTip>
      </Sider>

      {/* this button toggles the menu open and close */}
      <Button
        type="primary"
        className={cx(
          styles.sidenavButton,
          !isOpen && styles.flipped,
          isOpen && styles.siderOpen,
          leftDock && styles.leftDock,
        )}
        onClick={() => {
          showNewBadge && dismiss(EDismissable.NewSideNav);
          updateSubMenu();
          toggleMenuStatus();
          updateStyleBlockers('main', true); // hide style blockers
        }}
      >
        <i className="icon-back" />
      </Button>

      {/* if it's a legacy menu, show new badge */}
      <NewBadge
        dismissableKey={EDismissable.NewSideNav}
        size="small"
        absolute
        style={{ left: 'calc(100% / 20px)', top: 'calc(100% / 2)' }}
      />
    </Layout>
  );
}
