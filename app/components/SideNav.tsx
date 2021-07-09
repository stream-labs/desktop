import Vue from 'vue';
import cx from 'classnames';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import { NavigationService, TAppPage } from 'services/navigation';
import { UserService } from 'services/user';
import AppsNav from 'components/AppsNav';
import { WindowsService } from 'services/windows';
import { PlatformAppsService } from 'services/platform-apps';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { AppService } from '../services/app';
import { $t } from 'services/i18n';
import { NavTools } from 'components/shared/ReactComponent';
import styles from './SideNav.m.less';
import { LayoutService } from 'services/layout';
import { getPlatformService } from '../services/platforms';
import { getOS, OS } from 'util/operating-systems';
import Utils from 'services/utils';

interface IPageData {
  target: TAppPage;
  icon?: string;
  svgIcon?: JSX.Element;
  title: string;
  trackingTarget: string;
  newBadge?: boolean;
}

@Component({})
export default class SideNav extends Vue {
  @Inject() appService: AppService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() layoutService: LayoutService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  showTabDropdown = false;

  get availableFeatures() {
    return EAvailableFeatures;
  }

  @Prop() locked: boolean;

  navigate(page: TAppPage) {
    if (!this.userService.isLoggedIn && page !== 'Studio') return;

    this.navigationService.actions.navigate(page);
  }

  navigateToStudioTab(tabId: string) {
    this.navigate('Studio');
    this.layoutService.setCurrentTab(tabId);
  }

  featureIsEnabled(feature: EAvailableFeatures) {
    return this.incrementalRolloutService.views.featureIsEnabled(feature);
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get leftDock() {
    return this.customizationService.state.leftDock;
  }

  get appStoreVisible() {
    return this.userService.isLoggedIn && this.platformAppsService.state.storeVisible;
  }

  get studioTabs() {
    return Object.keys(this.layoutService.state.tabs).map((tab, i) => ({
      target: tab,
      title:
        i === 0 || !this.layoutService.state.tabs[tab].name
          ? $t('Editor')
          : this.layoutService.state.tabs[tab].name,
      icon: this.layoutService.state.tabs[tab].icon,
      trackingTarget: tab === 'default' ? 'editor' : 'custom',
    }));
  }

  get loading() {
    return this.appService.state.loading;
  }

  get pageData() {
    const pageData: IPageData[] = [];
    const hasThemes =
      this.userService.isLoggedIn &&
      getPlatformService(this.userService.platform.type).hasCapability('themes');

    if (this.userService.isLoggedIn) {
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

    if (this.appStoreVisible) {
      pageData.push({
        target: 'PlatformAppStore',
        icon: 'icon-store',
        title: $t('App Store'),
        trackingTarget: 'app-store',
      });
    }

    if (this.userService.isLoggedIn && this.featureIsEnabled(EAvailableFeatures.growTab)) {
      pageData.push({
        target: 'Grow',
        icon: 'icon-graph',
        title: $t('Grow'),
        trackingTarget: 'grow-tab',
      });
    }

    if (
      getOS() === OS.Windows &&
      this.userService.isLoggedIn &&
      this.incrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.highlighter)
    ) {
      pageData.push({
        target: 'Highlighter',
        svgIcon: <HighlighterIcon />,
        title: 'Highlighter',
        trackingTarget: 'highlighter',
        newBadge: true,
      });
    }

    return pageData;
  }

  get primaryStudioTab() {
    return (
      <div
        onMouseenter={() => (this.showTabDropdown = true)}
        onMouseleave={() => (this.showTabDropdown = false)}
      >
        <div
          class={cx(styles.primaryTab, {
            [styles.active]:
              this.page === 'Studio' && this.layoutService.state.currentTab === 'default',
          })}
        >
          {this.studioTab(this.studioTabs[0])}
          {this.studioTabs.length > 1 && this.userService.isPrime && (
            <i
              class={cx('icon-down', styles.studioDropdown, {
                [styles.studioDropdownActive]: this.layoutService.state.currentTab !== 'default',
              })}
            />
          )}
        </div>
        {this.additionalStudioTabs}
      </div>
    );
  }

  get additionalStudioTabs() {
    return (
      <transition name="sidenav-slide">
        {this.showTabDropdown && (
          <div class={styles.studioTabs}>
            {this.studioTabs.slice(1).map(page => this.studioTab(page))}
          </div>
        )}
      </transition>
    );
  }

  studioTab(page: { target: string; title: string; icon: string; trackingTarget: string }) {
    return (
      <div
        class={cx(styles.mainCell, {
          [styles.active]:
            this.page === 'Studio' && this.layoutService.state.currentTab === page.target,
        })}
        onClick={() => this.navigateToStudioTab(page.target)}
        vTrackClick={{ component: 'SideNav', target: page.trackingTarget }}
        title={page.title}
      >
        <i class={page.icon} />
      </div>
    );
  }

  render() {
    return (
      <div class={cx('side-nav', styles.container, { [styles.leftDock]: this.leftDock })}>
        {this.primaryStudioTab}
        {this.pageData.map(page => (
          <div
            class={cx(styles.mainCell, {
              [styles.active]: this.page === page.target,
              [styles.disabled]: !this.userService.isLoggedIn && page.target !== 'Studio',
            })}
            onClick={() => this.navigate(page.target as TAppPage)}
            vTrackClick={{ component: 'SideNav', target: page.trackingTarget }}
            title={page.title}
          >
            {!!page.icon && <i class={page.icon} />}
            {!!page.svgIcon && page.svgIcon}
            {page.newBadge && <div class={cx(styles.badge, styles.newBadge)}>{$t('New')}</div>}
          </div>
        ))}
        {this.platformAppsService.enabledApps.length > 0 && <AppsNav />}
        <NavTools />
      </div>
    );
  }
}

// TODO: Replace with a font icon
const HighlighterIcon = () => (
  <svg
    width="512"
    height="512"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0)">
      <path d="M20.949 298.483V458.483C20.949 487.902 44.885 511.816 74.282 511.816H458.282C487.701 511.816 511.615 487.901 511.615 458.483V298.483H20.949V298.483Z" />
      <path d="M252.757 48.776L172.927 67.72L239.807 166.131L326.271 146.462L252.757 48.776Z" />
      <path d="M150.741 72.99L64.703 93.384L128.5 192L217.471 171.187L150.741 72.99Z" />
      <path d="M511.274 93.086L493.119 24.222C488.938 7.47499 471.786 -3.06301 454.868 0.797987L383.188 17.822L451.199 118.089L503.316 106.228C506.153 105.588 508.585 103.817 510.079 101.343C511.573 98.869 511.999 95.902 511.274 93.086Z" />
      <path d="M360.981 23.091L275.413 43.4L349.055 141.299L428.863 123.144L360.981 23.091Z" />
      <path d="M128.5 192L94.314 277.15H178.005L212.138 191.838L128.5 192Z" />
      <path d="M235.114 191.838L200.981 277.15H284.671L318.805 191.838H235.114Z" />
      <path d="M500.949 191.838H448.448L414.315 277.171H511.616V202.504C511.615 196.595 506.858 191.838 500.949 191.838Z" />
      <path d="M341.781 191.838L307.647 277.15H391.317L425.471 191.838H341.781Z" />
      <path d="M42.517 98.675L25.13 102.792C16.661 104.712 9.493 109.853 4.949 117.235C0.405001 124.638 -0.938999 133.342 1.173 141.768L20.949 219.933V277.149H71.338L103.359 195.5L42.517 98.675Z" />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="511.816" height="511.816" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
