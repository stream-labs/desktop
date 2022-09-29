import React, { useState } from 'react';
// import Animation from 'rc-animate';
// import cx from 'classnames';
import { TAppPage } from 'services/navigation';
import { ENavName, EMenuItem, IMenuItem, IParentMenuItem, SideNavMenu } from 'services/side-nav';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { $t } from 'services/i18n';
// import { getPlatformService } from 'services/platforms';
import { Services } from 'components-react/service-provider';
import { injectState, useModule, mutation } from 'slap';
import { useVuex, useWatchVuex } from 'components-react/hooks';
import AppsNav from './AppsNav';
import NavTools from './NavTools';
// import styles from './SideNav.m.less';
import { Menu, Layout } from 'antd';
// import { has } from 'lodash';
import Scrollable from 'components/shared/Scrollable';

const { Sider } = Layout;

export default function SideNav() {
  const {
    AppService,
    CustomizationService,
    NavigationService,
    UserService,
    PlatformAppsService,
    IncrementalRolloutService,
    UsageStatisticsService,
    SideNavService,
  } = Services;

  function navigate(page: TAppPage, trackingTarget?: string) {
    if (!UserService.views.isLoggedIn && page !== 'Studio') return;

    if (trackingTarget) {
      UsageStatisticsService.actions.recordClick('SideNav', trackingTarget);
    }
    NavigationService.actions.navigate(page);
  }

  const {
    featureIsEnabled,
    // appStoreVisible,
    // currentPage,
    // leftDock,
    enabledApps,
    loggedIn,
    menu,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    currentPage: NavigationService.state.currentPage,
    leftDock: CustomizationService.state.leftDock,
    appStoreVisible: UserService.views.isLoggedIn && PlatformAppsService.state.storeVisible,
    loading: AppService.state.loading,
    enabledApps: PlatformAppsService.views.enabledApps,
    loggedIn: UserService.views.isLoggedIn,
    menu: SideNavService.views.state[ENavName.TopNav],
  }));

  // TODO HERE!!!!
  // useWatchVuex(
  //   () => SideNavService.views.sidebar[ENavName.TopNav],
  //   isPrime => isPrime && next(),
  // );

  // const menu = SideNavService.views.sidebar[ENavName.TopNav];
  /*
   * TODO: Create logic for legacy menu to show themes as primary items
   */
  // const hasThemes =
  //   loggedIn &&
  //   UserService.views.platform?.type &&
  //   getPlatformService(UserService.views.platform.type).hasCapability('themes');

  /*
   * WIP: logic for side bar nav.
   * TODO: Create logic for legacy menu. If the user is newly created, they will not see certain menu options.
   */
  const hasLegacyMenu = true;
  const [open, setOpen] = useState(false);

  /*
   * Theme audit will only ever be enabled on individual accounts or enabled
   * via command line flag. Not for general use.
   */
  const themeAuditEnabled = featureIsEnabled(EAvailableFeatures.themeAudit);

  console.log('SIDENAV COMPONENT: menu', menu);

  return (
    <Scrollable style={{ height: '100%' }}>
      <Layout
        hasSider
        style={{
          width: '100%',
          minHeight: '100vh',
        }}
      >
        <Sider
          collapsible
          collapsed={!open}
          onCollapse={() => setOpen(!open)}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {/* TODO: Apply styles */}
          {/* <div className={cx('side-nav', styles.container, { [styles.leftDock]: leftDock })}> */}
          <Menu forceSubMenuRender mode="inline">
            {menu.menuItems.map((menuItem: IParentMenuItem) => {
              if (
                (menuItem?.isLegacy && !hasLegacyMenu) ||
                (!loggedIn && menuItem.title === EMenuItem.AlertBox) ||
                (menuItem.hasOwnProperty('isActive') && !menuItem?.isActive)
              ) {
                // skip legacy menu items for new users
                // skip alert box library for users that are not logged in
                // skip inactive menu items
                return null;
              }
              return menuItem.hasOwnProperty('subMenuItems') ||
                (themeAuditEnabled && menuItem.title !== EMenuItem.ThemeAudit) ? (
                <Menu.SubMenu
                  key={`menu-${menuItem?.target ?? menuItem?.trackingTarget}`}
                  title={$t(menuItem.title)}
                  icon={menuItem?.icon && <i className={menuItem.icon} />}
                  onTitleClick={() =>
                    (menuItem.hasOwnProperty('isToggled') && console.log('Toggle studio mode')) ||
                    (menuItem?.target &&
                      navigate(menuItem.target as TAppPage, menuItem?.trackingTarget))
                  }
                >
                  {menuItem?.subMenuItems?.map((subMenuItem: IMenuItem, index: number) => (
                    <Menu.Item
                      key={`submenu-${subMenuItem?.target ?? subMenuItem?.trackingTarget ?? index}`}
                      title={$t(subMenuItem.title)}
                      onClick={() =>
                        menuItem?.target
                          ? navigate(menuItem?.target as TAppPage, menuItem?.trackingTarget)
                          : console.log('target tbd')
                      }
                      // TODO: Update onclick after all targets confirmed
                    >
                      {$t(subMenuItem.title)}
                    </Menu.Item>
                  ))}
                </Menu.SubMenu>
              ) : (
                <Menu.Item
                  key={`menu-${menuItem?.target ?? menuItem?.trackingTarget}`}
                  title={`${menuItem.title}`}
                  icon={menuItem?.icon && <i className={menuItem.icon} />}
                >
                  {$t(menuItem.title)}
                </Menu.Item>
              );
            })}
            {/* <Menu.Item>
            {/* TODO: Convert AppsNav to antd menu items
            {enabledApps.length > 0 && hasLegacyMenu && <AppsNav />}
          </Menu.Item> */}
          </Menu>

          <NavTools />
        </Sider>
      </Layout>
    </Scrollable>
  );
}

// class SideNavModule {
//   state = injectState({
//     compactView: true,
//     sidebar: SideNavMenu(),
//     menuItems: SideNavMenuItems(),
//   })

//   state = injectState({
//     stepIndex: 0,
//     processing: false,
//   });
//     get sidebar() {
//       return this.state.sidebar;
//     }

//     get compactView() {
//       return this.state.compactView;
//     }

//     get menuItems() {
//       return this.state.menuItems;
//     }

//     getMenuItem(name: EMenuItem) {
//       if (!name) return;
//       return this.state.menuItems[name];
//     }

//     isMenuItemActive(name: EMenuItem) {
//       if (!name) return;
//       return this.state.menuItems[name].isActive;
//     }
//   }

// function StudioTab(p: {
//   page: { target: string; title: string; icon: string; trackingTarget: string };
//   navigate: (page: TAppPage, trackingTarget?: string) => void;
// }) {
//   const { LayoutService, NavigationService } = Services;
//   const { currentPage } = useVuex(() => ({
//     currentPage: NavigationService.state.currentPage,
//   }));

//   function navigateToStudioTab(tabId: string, trackingTarget: string) {
//     p.navigate('Studio', trackingTarget);
//     LayoutService.actions.setCurrentTab(tabId);
//   }

//   return (
//     <div
//       className={cx(styles.mainCell, {
//         [styles.active]:
//           currentPage === 'Studio' && LayoutService.state.currentTab === p.page.target,
//       })}
//       onClick={() => navigateToStudioTab(p.page.target, p.page.trackingTarget)}
//       title={p.page.title}
//     >
//       <i className={p.page.icon} />
//     </div>
//   );
// }

// function PrimaryStudioTab(p: { currentPage: string; navigate: (page: TAppPage) => void }) {
//   const [showTabDropdown, setShowTabDropdown] = useState(false);
//   const { LayoutService } = Services;
//   const { currentTab, tabs } = useVuex(() => ({
//     currentTab: LayoutService.state.currentTab,
//     tabs: LayoutService.state.tabs,
//   }));

//   const studioTabs = Object.keys(tabs).map((tab, i) => ({
//     target: tab,
//     title: i === 0 || !tabs[tab].name ? $t('Editor') : tabs[tab].name,
//     icon: tabs[tab].icon,
//     trackingTarget: tab === 'default' ? 'editor' : 'custom',
//   }));

//   return (
//     <div
//       onMouseEnter={() => setShowTabDropdown(true)}
//       onMouseLeave={() => setShowTabDropdown(false)}
//     >
//       <div
//         className={cx(styles.primaryTab, {
//           [styles.active]: p.currentPage === 'Studio' && currentTab === 'default',
//         })}
//       >
//         <StudioTab page={studioTabs[0]} navigate={p.navigate} />
//         {studioTabs.length > 1 && (
//           <i
//             className={cx('icon-down', styles.studioDropdown, {
//               [styles.studioDropdownActive]: currentTab !== 'default',
//             })}
//           />
//         )}
//       </div>
//       <Animation transitionName="ant-slide-up">
//         {showTabDropdown && (
//           <div className={styles.studioTabs}>
//             {studioTabs.slice(1).map(page => (
//               <StudioTab page={page} navigate={p.navigate} key={page.target} />
//             ))}
//           </div>
//         )}
//       </Animation>
//     </div>
//   );
// }
