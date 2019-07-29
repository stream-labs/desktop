import Vue from 'vue';
import cx from 'classnames';
import electron from 'electron';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import { NavigationService, TAppPage } from 'services/navigation';
import { UserService } from 'services/user';
import Login from 'components/Login.vue';
import AppsNav from 'components/AppsNav.vue';
import { SettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import Utils from 'services/utils';
import { TransitionsService } from 'services/transitions';
import { PlatformAppsService } from 'services/platform-apps';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { FacemasksService } from 'services/facemasks';
import { AppService } from '../services/app';
import VueResize from 'vue-resize';
import { $t } from 'services/i18n';
import styles from './SideNav.m.less';
Vue.use(VueResize);

@Component({})
export default class TopNav extends Vue {
  @Inject() appService: AppService;
  @Inject() settingsService: SettingsService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() facemasksService: FacemasksService;

  slideOpen = false;

  studioModeTooltip = $t('Studio Mode');
  settingsTooltip = $t('Settings');
  helpTooltip = $t('Get Help');
  logoutTooltip = $t('Logout');

  availableChatbotPlatforms = ['twitch', 'mixer', 'youtube'];

  $refs: {
    top_nav: HTMLDivElement;
  };

  topNav: HTMLDivElement;
  responsiveClass = false;

  mounted() {
    this.topNav = this.$refs.top_nav;
    this.openDevTools();
  }

  get availableFeatures() {
    return EAvailableFeatures;
  }

  @Prop() locked: boolean;

  navigate(page: TAppPage) {
    this.navigationService.navigate(page);
  }

  featureIsEnabled(feature: EAvailableFeatures) {
    return this.incrementalRolloutService.featureIsEnabled(feature);
  }

  studioMode() {
    if (this.transitionsService.state.studioMode) {
      this.transitionsService.disableStudioMode();
    } else {
      this.transitionsService.enableStudioMode();
    }
  }

  get studioModeEnabled() {
    return this.transitionsService.state.studioMode;
  }

  openSettingsWindow() {
    this.settingsService.showSettings();
  }

  openDiscord() {
    electron.remote.shell.openExternal('https://discordapp.com/invite/stream');
  }

  get isDevMode() {
    return Utils.isDevMode();
  }

  openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get isUserLoggedIn() {
    return this.userService.state.auth;
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

  handleResize() {
    this.responsiveClass = this.topNav.clientWidth < 1200;
  }

  render(h: Function) {
    const pageData = [
      { title: 'Studio', icon: 'icon-studio' },
      { title: 'Live', icon: 'icon-live-dashboard' },
      { title: 'Themes', icon: 'icon-themes' },
    ];

    if (this.chatbotVisible) pageData.push({ title: 'Cloudbot', icon: 'icon-cloudbot' });
    if (this.appStoreVisible) pageData.push({ title: 'Store', icon: 'icon-store' });

    return (
      <div class={cx(styles.container, { [styles.leftDock]: this.leftDock })}>
        {pageData.map(page => (
          <div
            class={cx(styles.mainCell, { [styles.active]: this.page === page.title })}
            onClick={() => this.navigate(page.title as TAppPage)}
            v-tooltip={{ content: $t(page.title), placement: 'bottom' }}
          >
            <i class={page.icon} />
          </div>
        ))}
        {this.platformAppsService.enabledApps.length > 0 && <AppsNav />}

        <div class={styles.bottomTools}>
          {this.isDevMode && (
            <div class={styles.cell} onClick={this.openDevTools.bind(this)}>
              <i class="icon-developer" />
            </div>
          )}
          <div
            class={cx(styles.cell, { [styles.toggleOn]: this.studioModeEnabled })}
            onClick={this.studioMode.bind(this)}
          >
            <i class="icon-studio-mode-3" />
          </div>
          <div class={styles.cell} onClick={() => this.navigate('Help')}>
            <i class="icon-question" />
          </div>
          <div class={styles.cell} onClick={this.openSettingsWindow.bind(this)}>
            <i class="icon-settings" />
          </div>
        </div>
      </div>
    );
  }
}
