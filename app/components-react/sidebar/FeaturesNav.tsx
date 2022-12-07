import React, { useMemo } from 'react';
import {
  ENavName,
  EMenuItemKey,
  IMenuItem,
  IParentMenuItem,
  TExternalLinkType,
  menuTitles,
} from 'services/side-nav';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { TAppPage } from 'services/navigation';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { Menu } from 'antd';
import styles from './SideNav.m.less';
import SubMenu from 'components-react/shared/SubMenu';
import MenuItem from 'components-react/shared/MenuItem';
import AppsNav from './AppsNav';
import EditorTabs from './EditorTabs';
import cx from 'classnames';

export default function FeaturesNav() {
  function toggleStudioMode() {
    UsageStatisticsService.actions.recordClick('NavTools', 'studio-mode');
    if (TransitionsService.views.studioMode) {
      TransitionsService.actions.disableStudioMode();
    } else {
      TransitionsService.actions.enableStudioMode();
    }
  }

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

  function handleNavigation(menuItem: IMenuItem, key?: string) {
    if (menuItem.key === EMenuItemKey.StudioMode) {
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
    NavigationService,
    UserService,
    IncrementalRolloutService,
    UsageStatisticsService,
    SideNavService,
    LayoutService,
    TransitionsService,
  } = Services;

  const {
    featureIsEnabled,
    currentMenuItem,
    setCurrentMenuItem,
    tabs,
    loggedIn,
    menu,
    compactView,
    isOpen,
    openMenuItems,
    expandMenuItem,
    studioMode,
    showCustomEditor,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    currentMenuItem: SideNavService.views.currentMenuItem,
    setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
    tabs: LayoutService.state.tabs,
    loggedIn: UserService.views.isLoggedIn,
    menu: SideNavService.views.state[ENavName.TopNav],
    compactView: SideNavService.views.compactView,
    isOpen: SideNavService.views.isOpen,
    openMenuItems: SideNavService.views.getExpandedMenuItems(ENavName.TopNav),
    expandMenuItem: SideNavService.actions.expandMenuItem,
    studioMode: TransitionsService.views.studioMode,
    showCustomEditor: SideNavService.views.showCustomEditor,
  }));

  const menuItems = useMemo(() => {
    if (!loggedIn) {
      return menu.menuItems.filter(menuItem => menuItem.key === EMenuItemKey.Editor);
    }
    return !compactView
      ? menu.menuItems
      : menu.menuItems.filter((menuItem: IMenuItem) => {
          if (
            [
              EMenuItemKey.Editor,
              EMenuItemKey.Themes,
              EMenuItemKey.AppStore,
              EMenuItemKey.Highlighter,
            ].includes(menuItem.key as EMenuItemKey)
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
      defaultSelectedKeys={[EMenuItemKey.Editor]}
      getPopupContainer={triggerNode => triggerNode}
    >
      {menuItems.map((menuItem: IParentMenuItem) => {
        if (
          !menuItem?.isActive ||
          (menuItem.key === EMenuItemKey.ThemeAudit && !themeAuditEnabled)
        ) {
          // skip inactive menu items
          // skip legacy menu items for new users
          // skip Theme Audit if not enabled
          return null;
        } else if (menuItem.key === EMenuItemKey.Editor && loggedIn && studioTabs.length > 1) {
          // if there are multiple editor screens and the menu is closed, show them in the sidebar
          // if there are multiple editor screens and the menu is open, show them in a submenu
          if (showCustomEditor && !isOpen && !compactView) {
            return <EditorTabs key="editor-tabs" />;
          } else {
            return (
              <SubMenu
                key={menuItem.key}
                title={menuTitles(menuItem.key)}
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
              >
                <EditorTabs type="submenu" />
              </SubMenu>
            );
          }
        } else if (menuItem.hasOwnProperty('subMenuItems')) {
          // display submenu if there are submenu items
          return (
            <SubMenu
              key={menuItem.key}
              title={menuTitles(menuItem.key)}
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
            >
              {menuItem?.subMenuItems?.map((subMenuItem: IMenuItem) => (
                <FeaturesNavItem
                  isSubMenuItem={true}
                  menuItem={subMenuItem}
                  handleNavigation={handleNavigation}
                />
              ))}

              {/* handle show apps in the submenu */}
              {menuItem.key === EMenuItemKey.AppStore && <AppsNav type="enabled" />}
            </SubMenu>
          );
        } else {
          // otherwise, display menu item
          return <FeaturesNavItem menuItem={menuItem} handleNavigation={handleNavigation} />;
        }
      })}

      {loggedIn && !compactView && (
        // apps shown in sidebar
        <AppsNav />
      )}
    </Menu>
  );
}

function FeaturesNavItem(p: {
  isSubMenuItem?: boolean;
  menuItem: IMenuItem | IParentMenuItem;
  handleNavigation: (menuItem: IMenuItem, key?: string) => void;
}) {
  const { SideNavService, TransitionsService } = Services;
  const { isSubMenuItem, menuItem, handleNavigation } = p;

  const { currentMenuItem, isOpen, studioMode } = useVuex(() => ({
    currentMenuItem: SideNavService.views.currentMenuItem,
    isOpen: SideNavService.views.isOpen,
    studioMode: TransitionsService.views.studioMode,
  }));

  return (
    <MenuItem
      key={menuItem.key}
      className={cx(
        !isSubMenuItem && !isOpen && styles.closed,
        !isSubMenuItem &&
          menuItem.key === EMenuItemKey.StudioMode &&
          studioMode &&
          styles.studioMode,
        currentMenuItem === menuItem.key && styles.active,
      )}
      title={menuTitles(menuItem.key)}
      icon={menuItem?.icon && <i className={menuItem.icon} />}
      onClick={() => {
        handleNavigation(menuItem);
      }}
    >
      {menuTitles(menuItem.key)}
    </MenuItem>
  );
}
