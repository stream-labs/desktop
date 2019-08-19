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

@Component({})
export default class SideNav extends Vue {
  @Inject() appService: AppService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  availableChatbotPlatforms = ['twitch', 'mixer', 'youtube'];

  get availableFeatures() {
    return EAvailableFeatures;
  }

  @Prop() locked: boolean;

  navigate(page: TAppPage) {
    if (!this.userService.isLoggedIn()) return;

    this.navigationService.navigate(page);
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
    return this.platformAppsService.state.storeVisible;
  }

  get chatbotVisible() {
    return (
      this.userService.isLoggedIn() &&
      this.availableChatbotPlatforms.indexOf(this.userService.platform.type) !== -1
    );
  }

  get loading() {
    return this.appService.state.loading;
  }

  render(h: Function) {
    const pageData = [
      { target: 'Studio', icon: 'icon-studio' },
      { target: 'Live', icon: 'icon-live-dashboard' },
      { target: 'BrowseOverlays', icon: 'icon-themes', title: 'Themes' },
    ];

    if (this.chatbotVisible) pageData.push({ target: 'Chatbot', icon: 'icon-cloudbot' });
    if (this.appStoreVisible) {
      pageData.push({ target: 'PlatformAppStore', icon: 'icon-store', title: 'Store' });
    }

    return (
      <div class={cx('side-nav', styles.container, { [styles.leftDock]: this.leftDock })}>
        {pageData.map(page => (
          <div
            class={cx(styles.mainCell, {
              [styles.active]: this.page === page.target,
              [styles.disabled]: !this.userService.isLoggedIn(),
            })}
            onClick={() => this.navigate(page.target as TAppPage)}
            title={$t(page.title || page.target)}
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
