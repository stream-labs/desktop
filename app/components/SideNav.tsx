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
import NavTools from './NavTools';
import styles from './SideNav.m.less';
import { LayoutService } from 'services/layout';

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

  availableChatbotPlatforms = ['twitch', 'mixer', 'youtube'];
  showTabDropdown = false;

  get availableFeatures() {
    return EAvailableFeatures;
  }

  @Prop() locked: boolean;

  navigate(page: TAppPage) {
    if (!this.userService.isLoggedIn && page !== 'Studio') return;

    this.navigationService.navigate(page);
  }

  navigateToStudioTab(tabId: string) {
    this.navigate('Studio');
    this.layoutService.setCurrentTab(tabId);
  }

  featureIsEnabled(feature: EAvailableFeatures) {
    return this.incrementalRolloutService.featureIsEnabled(feature);
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

  get chatbotVisible() {
    return (
      this.userService.isLoggedIn &&
      this.availableChatbotPlatforms.indexOf(this.userService.platform.type) !== -1
    );
  }

  get studioTabs() {
    return Object.keys(this.layoutService.state.tabs).map(tab => ({
      target: tab,
      title: this.layoutService.state.tabs[tab].name || $t('Editor'),
      icon: this.layoutService.state.tabs[tab].icon,
    }));
  }

  get loading() {
    return this.appService.state.loading;
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
            <i class={cx('icon-down', styles.studioDropdown)} />
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

  studioTab(page: { target: string; title: string; icon: string }) {
    return (
      <div
        class={cx(styles.mainCell, {
          [styles.active]:
            this.page === 'Studio' && this.layoutService.state.currentTab === page.target,
        })}
        onClick={() => this.navigateToStudioTab(page.target)}
        title={page.title}
      >
        <i class={page.icon} />
      </div>
    );
  }

  render() {
    const pageData = [{ target: 'BrowseOverlays', icon: 'icon-themes', title: $t('Themes') }];

    if (this.chatbotVisible) {
      pageData.push({ target: 'Chatbot', icon: 'icon-cloudbot', title: $t('Cloudbot') });
    }
    if (this.appStoreVisible) {
      pageData.push({ target: 'PlatformAppStore', icon: 'icon-store', title: $t('App Store') });
    }

    return (
      <div class={cx('side-nav', styles.container, { [styles.leftDock]: this.leftDock })}>
        {this.primaryStudioTab}
        {pageData.map(page => (
          <div
            class={cx(styles.mainCell, {
              [styles.active]: this.page === page.target,
              [styles.disabled]: !this.userService.isLoggedIn && page.target !== 'Studio',
            })}
            onClick={() => this.navigate(page.target as TAppPage)}
            title={page.title}
          >
            <i class={page.icon} />
          </div>
        ))}
        {this.platformAppsService.enabledApps.length > 0 && <AppsNav />}
        <NavTools />
      </div>
    );
  }
}
