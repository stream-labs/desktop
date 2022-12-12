import React from 'react';
import { Services } from 'components-react/service-provider';
import styles from './SideNav.m.less';
import MenuItem from 'components-react/shared/MenuItem';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';

interface IEditorTabs {
  type?: 'root' | 'submenu';
}

export default function EditorTabs(p: IEditorTabs) {
  const { NavigationService, SideNavService, LayoutService } = Services;
  const { type = 'root' } = p;

  const { currentMenuItem, setCurrentMenuItem, studioTabs, isOpen } = useVuex(() => ({
    currentMenuItem:
      SideNavService.views.currentMenuItem === 'editor'
        ? 'default'
        : SideNavService.views.currentMenuItem,
    setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
    studioTabs: LayoutService.views.studioTabs,
    compactView: SideNavService.views.compactView,
    isOpen: SideNavService.views.isOpen,
  }));

  function navigateToStudioTab(tabId: string, trackingTarget: string, key: string) {
    if (currentMenuItem !== key) {
      NavigationService.actions.navigate('Studio', { trackingTarget });
      LayoutService.actions.setCurrentTab(tabId);
      setCurrentMenuItem(key);
    }
  }

  // if closed, show editor tabs in sidenav when tab is toggled on
  // show all editor tabs in submenu
  // don't translate tab title because the user has set it
  return type === 'root' ? (
    <>
      {studioTabs.map(tab => (
        <MenuItem
          key={tab.key}
          className={cx(
            !isOpen && styles.closed,
            (currentMenuItem === tab.key || currentMenuItem === `sub-${tab.key}`) && styles.active,
          )}
          title={tab.title}
          icon={<i className={tab.icon} />}
          onClick={() => navigateToStudioTab(tab.target, tab.trackingTarget, tab.key)}
        >
          {tab.title}
        </MenuItem>
      ))}
    </>
  ) : (
    <>
      {studioTabs.map(tab => (
        <MenuItem
          key={`sub-${tab.key}`}
          className={cx(
            (currentMenuItem === tab.key || currentMenuItem === `sub-${tab.key}`) && styles.active,
          )}
          title={tab?.title ?? 'Editor'}
          icon={<i className={tab.icon} />}
          onClick={() => navigateToStudioTab(tab.target, tab.trackingTarget, `sub-${tab.key}`)}
          type="submenu"
        >
          {tab?.title ?? 'Editor'}
        </MenuItem>
      ))}
    </>
  );
}
