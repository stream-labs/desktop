import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { GuestApiService } from 'services/guest-api';
import { I18nService } from 'services/i18n';
import electron from 'electron';
import { PlatformAppsService } from 'services/platform-apps';
import { PlatformAppStoreService } from 'services/platform-app-store';
import { NavigationService } from 'services/navigation';
import Utils from 'services/utils';
import BrowserFrame from 'components/shared/BrowserFrame.vue';

@Component({
  components: {
    BrowserFrame,
  },
})
export default class PlatformAppStore extends Vue {
  @Inject() userService: UserService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() platformAppStoreService: PlatformAppStoreService;
  @Inject() guestApiService: GuestApiService;
  @Inject() i18nService: I18nService;
  @Inject() navigationService: NavigationService;

  @Prop() params: {
    appId?: string;
  };

  $refs: {
    appStoreWebview: BrowserFrame;
  };

  mounted() {
    this.$refs.appStoreWebview.$on('did-finish-load', () => {
      if (Utils.isDevMode()) {
        this.$refs.appStoreWebview.openDevTools();
      }
      this.guestApiService.exposeApi(this.$refs.appStoreWebview.id, {
        reloadProductionApps: this.reloadProductionApps,
        openLinkInBrowser: this.openLinkInBrowser,
        onPaypalAuthSuccess: this.onPaypalAuthSuccessHandler,
        navigateToApp: this.navigateToApp,
      });
    });
  }

  async onPaypalAuthSuccessHandler(callback: Function) {
    this.platformAppStoreService.bindsPaypalSuccessCallback(callback);
  }

  async openLinkInBrowser(url: string) {
    electron.remote.shell.openExternal(url);
  }

  async reloadProductionApps() {
    this.platformAppsService.loadProductionApps();
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get appStoreUrl() {
    return this.userService.appStoreUrl(this.params.appId);
  }

  get partition() {
    return this.userService.state.auth.partition;
  }

  async navigateToApp(appId: string) {
    this.navigationService.navigate('PlatformAppMainPage', { appId });
  }
}
