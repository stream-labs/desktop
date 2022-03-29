import React, { useState } from 'react';
import Animation from 'rc-animate';
import cx from 'classnames';
import { TAppPage } from 'services/navigation';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { $t } from 'services/i18n';
import { getPlatformService } from 'services/platforms';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import AppsNav from './AppsNav';
import NavTools from './NavTools';
import styles from './SideNav.m.less';

interface IPageData {
  target: TAppPage;
  icon?: string;
  svgIcon?: JSX.Element;
  title: string;
  trackingTarget: string;
  newBadge?: boolean;
}

export default function SideNav() {
  const {
    AppService,
    CustomizationService,
    NavigationService,
    UserService,
    PlatformAppsService,
    IncrementalRolloutService,
    UsageStatisticsService,
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
    appStoreVisible,
    currentPage,
    leftDock,
    enabledApps,
    loggedIn,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    currentPage: NavigationService.state.currentPage,
    leftDock: CustomizationService.state.leftDock,
    appStoreVisible: UserService.views.isLoggedIn && PlatformAppsService.state.storeVisible,
    loading: AppService.state.loading,
    enabledApps: PlatformAppsService.views.enabledApps,
    loggedIn: UserService.views.isLoggedIn,
  }));

  const pageData: IPageData[] = [];
  const hasThemes =
    loggedIn &&
    UserService.views.platform?.type &&
    getPlatformService(UserService.views.platform.type).hasCapability('themes');

  if (loggedIn) {
    pageData.push({
      target: 'AlertboxLibrary',
      icon: 'icon-alert-box',
      title: $t('Alertbox Library'),
      trackingTarget: 'alertbox-library',
    });
  }

  if (hasThemes) {
    pageData.push({
      target: 'BrowseOverlays',
      icon: 'icon-themes',
      title: $t('Themes'),
      trackingTarget: 'themes',
    });
  }

  if (appStoreVisible) {
    pageData.push({
      target: 'PlatformAppStore',
      icon: 'icon-store',
      title: $t('App Store'),
      trackingTarget: 'app-store',
    });
  }

  if (loggedIn && featureIsEnabled(EAvailableFeatures.growTab)) {
    pageData.push({
      target: 'Grow',
      icon: 'icon-graph',
      title: $t('Grow'),
      trackingTarget: 'grow-tab',
    });
  }

  if (loggedIn) {
    pageData.push({
      target: 'Highlighter',
      svgIcon: <HighlighterIcon />,
      title: 'Highlighter',
      trackingTarget: 'highlighter',
      newBadge: true,
    });
  }

  // Will only ever be enabled on individual accounts or enabled
  // via command line flag. Not for general use.
  if (featureIsEnabled(EAvailableFeatures.themeAudit)) {
    pageData.push({
      target: 'ThemeAudit',
      icon: 'fas fa-exclamation-triangle',
      title: 'Theme Audit',
      trackingTarget: 'themeaudit',
    });
  }

  return (
    <div className={cx('side-nav', styles.container, { [styles.leftDock]: leftDock })}>
      <PrimaryStudioTab currentPage={currentPage} navigate={navigate} />
      {pageData.map(page => (
        <div
          key={page.target}
          className={cx(styles.mainCell, {
            [styles.active]: currentPage === page.target,
            [styles.disabled]: !loggedIn && page.target !== 'Studio',
          })}
          onClick={() => navigate(page.target as TAppPage, page.trackingTarget)}
          title={page.title}
        >
          {!!page.icon && <i className={page.icon} />}
          {!!page.svgIcon && page.svgIcon}
          {page.newBadge && <div className={cx(styles.badge, styles.newBadge)}>{$t('New')}</div>}
        </div>
      ))}
      {enabledApps.length > 0 && <AppsNav />}
      <NavTools />
    </div>
  );
}

function StudioTab(p: {
  page: { target: string; title: string; icon: string; trackingTarget: string };
  navigate: (page: TAppPage, trackingTarget?: string) => void;
}) {
  const { LayoutService, NavigationService } = Services;
  const { currentPage } = useVuex(() => ({
    currentPage: NavigationService.state.currentPage,
  }));

  function navigateToStudioTab(tabId: string, trackingTarget: string) {
    p.navigate('Studio', trackingTarget);
    LayoutService.actions.setCurrentTab(tabId);
  }

  return (
    <div
      className={cx(styles.mainCell, {
        [styles.active]:
          currentPage === 'Studio' && LayoutService.state.currentTab === p.page.target,
      })}
      onClick={() => navigateToStudioTab(p.page.target, p.page.trackingTarget)}
      title={p.page.title}
    >
      <i className={p.page.icon} />
    </div>
  );
}

function PrimaryStudioTab(p: { currentPage: string; navigate: (page: TAppPage) => void }) {
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const { LayoutService } = Services;
  const { currentTab, tabs } = useVuex(() => ({
    currentTab: LayoutService.state.currentTab,
    tabs: LayoutService.state.tabs,
  }));

  const studioTabs = Object.keys(tabs).map((tab, i) => ({
    target: tab,
    title: i === 0 || !tabs[tab].name ? $t('Editor') : tabs[tab].name,
    icon: tabs[tab].icon,
    trackingTarget: tab === 'default' ? 'editor' : 'custom',
  }));

  return (
    <div
      onMouseEnter={() => setShowTabDropdown(true)}
      onMouseLeave={() => setShowTabDropdown(false)}
    >
      <div
        className={cx(styles.primaryTab, {
          [styles.active]: p.currentPage === 'Studio' && currentTab === 'default',
        })}
      >
        <StudioTab page={studioTabs[0]} navigate={p.navigate} />
        {studioTabs.length > 1 && (
          <i
            className={cx('icon-down', styles.studioDropdown, {
              [styles.studioDropdownActive]: currentTab !== 'default',
            })}
          />
        )}
      </div>
      <Animation transitionName="sidenav-slide">
        {showTabDropdown && (
          <div className={styles.studioTabs}>
            {studioTabs.slice(1).map(page => (
              <StudioTab page={page} navigate={p.navigate} key={page.target} />
            ))}
          </div>
        )}
      </Animation>
    </div>
  );
}

// TODO: Replace with a font icon
const HighlighterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0)">
      <path d="M0.736816 10.4971V16.1241C0.736816 17.1587 1.57862 17.9997 2.61248 17.9997H16.1173C17.152 17.9997 17.993 17.1587 17.993 16.1241V10.4971H0.736816V10.4971Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.30361 2.56988L8.88907 1.71484L11.4745 5.15035L7.64504 6.01543L7.64807 6.01989L4.51906 6.75186L2.27539 3.28364L5.30125 2.56641L5.30361 2.56988Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.3426 0.851841L17.9811 3.27371C18.0066 3.37275 17.9916 3.47709 17.9391 3.5641C17.8865 3.65111 17.801 3.71339 17.7012 3.7359L14.3855 4.42042L12.2759 4.96974L9.68604 1.52675L10.6496 1.34058L15.9974 0.028045C16.5924 -0.107742 17.1956 0.262868 17.3426 0.851841Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.26681 6.75197L8.26877 6.74707H11.2121L10.0116 9.74741H7.06836L7.06862 9.74676H3.31689L4.51918 6.75212L8.26681 6.75197Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8198 9.74741L12.0203 6.74707H15.7717H16.5H17.6181C17.8259 6.74707 17.9932 6.91437 17.9933 7.12218V9.74815H14.5713L14.5716 9.74741H10.8198Z"
      />
      <path d="M1.49516 3.4707L0.883682 3.61549C0.585836 3.68302 0.333746 3.86382 0.173938 4.12344C0.014131 4.3838 -0.033136 4.68991 0.0411407 4.98624L0.736641 7.73522V9.74745H2.50877L3.63491 6.87594L1.49516 3.4707Z" />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="18" height="18" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
