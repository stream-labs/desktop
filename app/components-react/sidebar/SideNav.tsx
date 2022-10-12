import React, { useMemo, useLayoutEffect, useRef } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import cx from 'classnames';
import { TAppPage } from 'services/navigation';
import { ENavName, EMenuItem, IMenuItem, IParentMenuItem } from 'services/side-nav';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import NavTools from './NavTools';
import styles from './SideNav.m.less';
import { Menu, Layout, Button } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
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

  function navigate(page: TAppPage, trackingTarget?: string, type?: string) {
    if (!UserService.views.isLoggedIn && page !== 'Studio') return;

    if (trackingTarget) {
      UsageStatisticsService.actions.recordClick('SideNav', trackingTarget);
    }

    if (type) {
      NavigationService.actions.navigate(page, { type });
    } else {
      NavigationService.actions.navigate(page);
    }

    // LayoutService.actions.setCurrentTab(page as string);
  }

  function navigateApp(appId: string) {
    NavigationService.actions.navigate('PlatformAppMainPage', { appId });
    LayoutService.actions.setCurrentTab(appId);
  }

  function navigateToStudioTab(tabId: string, trackingTarget: string) {
    NavigationService.actions.navigate('Studio', { trackingTarget });
    LayoutService.actions.setCurrentTab(tabId);
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

  const {
    featureIsEnabled,
    appStoreVisible,
    currentPage, // TODO: tracking & styling for currentPage
    tabs,
    leftDock,
    showSidebarApps,
    apps,
    loggedIn,
    menu,
    isOpen,
    openMenuItems,
    expandMenuItem,
    hasLegacyMenu,
    studioMode,
    showCustomEditor,
    updateStyleBlockers,
    hideStyleBlockers,
    dismiss,
    showNewBadge,
    compactView,
    setCompactView,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    appStoreVisible: UserService.views.isLoggedIn && PlatformAppsService.state.storeVisible,
    currentPage: NavigationService.state.currentPage,
    tabs: LayoutService.state.tabs,
    leftDock: CustomizationService.state.leftDock,
    showSidebarApps: SideNavService.views.showSidebarApps,
    apps: Object.values(SideNavService.views.apps).sort((a, b) => a.index - b.index),
    loggedIn: UserService.views.isLoggedIn,
    menu: SideNavService.views.state[ENavName.TopNav],
    isOpen: SideNavService.views.isOpen,
    openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.TopNav),
    expandMenuItem: SideNavService.actions.expandMenuItem,
    hasLegacyMenu: SideNavService.views.hasLegacyMenu,
    studioMode: TransitionsService.views.studioMode,
    showCustomEditor: SideNavService.views.showCustomEditor,
    updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
    hideStyleBlockers: WindowsService.state.hideStyleBlockers,
    dismiss: DismissablesService.actions.dismiss,
    showNewBadge:
      DismissablesService.views.shouldShow(EDismissable.NewSideNav) &&
      SideNavService.views.hasLegacyMenu,
    compactView: SideNavService.views.compactView,
    setCompactView: SideNavService.actions.setCompactView,
  }));

  const ref = useRef<HTMLDivElement>(null);

  const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    entries.forEach((entry: ResizeObserverEntry) => {
      const width = Math.floor(entry.contentRect.width);
      if (width === 50 || width === 200) {
        updateStyleBlockers('main', false);
      } else if (!hideStyleBlockers && (width > 50 || width < 200)) {
        updateStyleBlockers('main', true);
      }
    });
  });

  useLayoutEffect(() => {
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
  }, [ref]);

  console.log('loggedIn ', loggedIn);
  console.log('hasLegacyMenu ', hasLegacyMenu);

  console.log('menu.menuItems ', menu.menuItems);

  const menuItems = menu.menuItems;

  // useMemo(() => {
  //   if (!loggedIn) {
  //     menu.menuItems.map(menuItem => {
  //       if (menuItem.title !== EMenuItem.Editor) {
  //         return { ...menuItem, isActive: false };
  //       }
  //       return menuItem;
  //     });
  //   } else if (loggedIn && !hasLegacyMenu) {
  //     // setCompactView();
  //     menu.menuItems.map(menuItem => {
  //       if (
  //         ![EMenuItem.Editor, EMenuItem.Themes, EMenuItem.AppStore, EMenuItem.Highlighter].includes(
  //           menuItem.title as EMenuItem,
  //         )
  //       ) {
  //         return { ...menuItem, isActive: false };
  //       }
  //       return menuItem;
  //     });
  //   }
  //   return menu.menuItems;
  // }, [menu, loggedIn, hasLegacyMenu, compactView]);

  // const menuItems = useMemo(() => {
  //   if (!loggedIn) {
  //     menu.menuItems.map(menuItem => {
  //       if (menuItem.title !== EMenuItem.Editor) {
  //         return { ...menuItem, isActive: false };
  //       }
  //       return menuItem;
  //     });
  //   } else if (loggedIn && !hasLegacyMenu) {
  //     // setCompactView();
  //     menu.menuItems.map(menuItem => {
  //       if (
  //         ![EMenuItem.Editor, EMenuItem.Themes, EMenuItem.AppStore, EMenuItem.Highlighter].includes(
  //           menuItem.title as EMenuItem,
  //         )
  //       ) {
  //         return { ...menuItem, isActive: false };
  //       }
  //       return menuItem;
  //     });
  //   }
  //   return menu.menuItems;
  // }, [menu, loggedIn, hasLegacyMenu, compactView]);

  console.log('menuItems ', menuItems);
  console.log('compactView ', compactView);

  const studioTabs = Object.keys(tabs).map((tab, i) => ({
    target: tab,
    title: i === 0 || !tabs[tab].name ? $t('Editor') : tabs[tab].name,
    icon: tabs[tab].icon,
    trackingTarget: tab === 'default' ? 'editor' : 'custom',
  }));

  /*
   * Theme audit will only ever be enabled on individual accounts or enabled
   * via command line flag. Not for general use.
   */
  const themeAuditEnabled = featureIsEnabled(EAvailableFeatures.themeAudit);

  console.log('currentPage ', currentPage);

  return (
    <Layout key="sidenav" hasSider className="sidenav">
      <Sider
        collapsible
        collapsed={!isOpen}
        trigger={null}
        className={cx(
          styles.sidenav,
          styles.sidenavSider,
          !isOpen && styles.siderClosed,
          !leftDock && styles.noLeftDock,
        )}
        ref={ref}
      >
        <Scrollable className={cx(styles.sidenav, styles.sidenavScroll)}>
          <Menu
            key={ENavName.TopNav}
            forceSubMenuRender
            mode="inline"
            className={cx(
              styles.menuContainer,
              !isOpen && (styles.siderClosed, styles.menuWrapper),
            )}
            defaultOpenKeys={openMenuItems && openMenuItems}
          >
            {menuItems.map((menuItem: IParentMenuItem) => {
              if (
                !menuItem?.isActive ||
                (menuItem?.isLegacy && !hasLegacyMenu) ||
                (menuItem.title === EMenuItem.ThemeAudit && !themeAuditEnabled)
              ) {
                // skip inactive menu items
                // skip legacy menu items for new users
                // skip Theme Audit if not enabled
                return null;
              } else if (menuItem.title === EMenuItem.Editor && studioTabs.length > 0) {
                // if legacy menu, show editor tabs in sidenav
                // which can be toggled to show or hide
                // otherwise, show editor tabs in submenu
                // don't translate tab title because the user has set it
                return hasLegacyMenu && showCustomEditor ? (
                  studioTabs.map(tab => (
                    <Menu.Item
                      key={tab.title}
                      className={cx(
                        styles.sidenavItem,
                        !isOpen && styles.closed,
                        // currentPage === tab.target && styles.active,
                      )}
                      title={tab.title}
                      icon={<i className={tab.icon} />}
                      onClick={() => navigateToStudioTab(tab.target, tab.trackingTarget)}
                    >
                      {tab.title}
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.SubMenu
                    key={menuItem.title}
                    title={$t(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onTitleClick={() => {
                      menuItem?.subMenuItems[0]?.target &&
                        !isOpen &&
                        navigate(
                          menuItem?.subMenuItems[0]?.target as TAppPage,
                          menuItem?.subMenuItems[0]?.trackingTarget,
                        );
                      expandMenuItem(ENavName.TopNav, menuItem.title as EMenuItem);
                    }}
                    className={cx(
                      !isOpen && styles.closed,
                      currentPage === menuItem.target && styles.active,
                    )}
                  >
                    {studioTabs.map(tab => (
                      <Menu.Item
                        key={`tab-${tab.title}`}
                        className={cx(
                          styles.sidenavItem,
                          // currentPage === tab.target && styles.active,
                        )}
                        title={tab.title}
                        icon={<i className={tab.icon} />}
                        onClick={() => {
                          navigateToStudioTab(tab.target as TAppPage, tab.trackingTarget);
                        }}
                      >
                        {tab.title}
                      </Menu.Item>
                    ))}
                  </Menu.SubMenu>
                );
              } else if (menuItem.title === EMenuItem.AppStore) {
                return (
                  <Menu.SubMenu
                    key={menuItem.title}
                    title={$t(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onTitleClick={() => {
                      menuItem?.subMenuItems[0]?.target &&
                        !isOpen &&
                        navigate(
                          menuItem?.subMenuItems[0]?.target as TAppPage,
                          menuItem?.subMenuItems[0]?.trackingTarget,
                        );
                      expandMenuItem(ENavName.TopNav, menuItem.title as EMenuItem);
                    }}
                    className={cx(
                      !isOpen && styles.closed,
                      currentPage === menuItem.target && styles.active,
                    )}
                  >
                    {/* The first sub menu item is the Apps Manager */}
                    {appStoreVisible && (
                      <Menu.Item
                        key={`sub-${menuItem.title}`}
                        className={cx(
                          styles.sidenavItem,
                          currentPage === menuItem?.target && styles.active,
                        )}
                        title={menuItem?.subMenuItems[0]?.title}
                        onClick={() =>
                          navigate(
                            menuItem?.subMenuItems[0].target as TAppPage,
                            menuItem?.subMenuItems[0].trackingTarget,
                            // menuItem?.subMenuItems[0].type,
                          )
                        }
                      >
                        {/* TODO: Translations for app titles? */}
                        {menuItem?.subMenuItems[0]?.title}
                      </Menu.Item>
                    )}
                    {apps.map(
                      app =>
                        app.isActive && (
                          <Menu.Item
                            key={`sub-${app.id}`}
                            className={cx(
                              styles.sidenavItem,
                              currentPage === menuItem?.target && styles.active,
                            )}
                            title={app.name}
                            onClick={() => app?.id && navigateApp(app.id)}
                          >
                            {app.name}
                          </Menu.Item>
                        ),
                    )}
                  </Menu.SubMenu>
                );
              } else {
                // otherwise, show a menu item or a menu item with a submenu
                return menuItem.hasOwnProperty('subMenuItems') ? (
                  <Menu.SubMenu
                    key={menuItem.title}
                    title={$t(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onTitleClick={() => {
                      menuItem?.subMenuItems[0]?.target &&
                        !isOpen &&
                        navigate(
                          menuItem?.subMenuItems[0]?.target as TAppPage,
                          menuItem?.subMenuItems[0]?.trackingTarget,
                        );
                      expandMenuItem(ENavName.TopNav, menuItem.title as EMenuItem);
                    }}
                    className={cx(
                      !isOpen && styles.closed,
                      currentPage === menuItem.target && styles.active,
                    )}
                  >
                    {menuItem?.subMenuItems?.map((subMenuItem: IMenuItem, index: number) => (
                      <Menu.Item
                        key={`sub-${subMenuItem.title}`}
                        className={cx(
                          styles.sidenavItem,
                          currentPage === subMenuItem?.target && styles.active,
                        )}
                        title={$t(subMenuItem.title)}
                        onClick={() => {
                          if (subMenuItem?.target && subMenuItem?.type) {
                            // if navigating to specific tab on page
                            navigate(
                              subMenuItem?.target as TAppPage,
                              subMenuItem?.trackingTarget,
                              subMenuItem?.type,
                            );
                          } else if (subMenuItem?.target) {
                            navigate(subMenuItem?.target as TAppPage, subMenuItem?.trackingTarget);
                          }
                        }}
                      >
                        {$t(subMenuItem.title)}
                      </Menu.Item>
                    ))}
                  </Menu.SubMenu>
                ) : (
                  <Menu.Item
                    key={menuItem.title}
                    className={cx(
                      styles.sidenavItem,
                      !isOpen && styles.closed,
                      menuItem.title === EMenuItem.StudioMode && studioMode && styles.studioMode,
                      currentPage === menuItem.target && styles.active,
                    )}
                    title={$t(menuItem.title)}
                    icon={menuItem?.icon && <i className={menuItem.icon} />}
                    onClick={() => {
                      if (menuItem.title === EMenuItem.StudioMode) {
                        // if studio mode, toggle studio mode
                        toggleStudioMode();
                      } else if (menuItem?.target && menuItem?.type) {
                        // if navigating to specific tab on page
                        navigate(
                          menuItem?.target as TAppPage,
                          menuItem?.trackingTarget,
                          menuItem?.type,
                        );
                      } else if (menuItem?.target) {
                        navigate(menuItem?.target as TAppPage, menuItem?.trackingTarget);
                      }
                    }}
                  >
                    {$t(menuItem.title)}
                  </Menu.Item>
                );
              }
            })}
            {hasLegacyMenu && showSidebarApps && apps.length > 0 && (
              // if legacy menu, apps can also be seen in the sidebar
              // below the regular menu items
              <>
                {apps.map(
                  app =>
                    app.isActive && (
                      <Menu.Item
                        key={app.id}
                        className={cx(
                          styles.sidenavItem,
                          !isOpen && styles.closed,
                          // currentPage === app.target && styles.active)}
                        )}
                        title={app.name}
                        icon={
                          app?.icon && app?.id ? (
                            <img src={iconSrc(app?.id, app.icon)} className={styles.appIcons} />
                          ) : (
                            <i className="icon-integrations" />
                          )
                        }
                        onClick={() => app?.id && navigateApp(app?.id)}
                      >
                        {app.name}
                      </Menu.Item>
                    ),
                )}
              </>
            )}
          </Menu>

          {/* show the bottom navigation menu */}
          <NavTools />
        </Scrollable>
      </Sider>

      {/* this button toggles the menu open and close */}
      <Button
        type="primary"
        className={cx(
          styles.sidenav,
          styles.sidenavButton,
          !isOpen && styles.flipped,
          isOpen && styles.siderOpen,
          leftDock && styles.leftDock,
        )}
        onClick={() => {
          showNewBadge && dismiss(EDismissable.NewSideNav);
          SideNavService.actions.toggleMenuStatus();
        }}
      >
        <i className="icon-back" />
      </Button>

      {/* if it's a legacy menu, show new badge*/}
      {showNewBadge && <div className={cx(styles.badge, styles.newBadge)}>{$t('New')}</div>}
    </Layout>
  );
}
