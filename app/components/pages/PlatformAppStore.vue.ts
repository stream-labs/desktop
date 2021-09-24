import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { I18nService } from 'services/i18n';
import { PlatformAppsService } from 'services/platform-apps';
import { PlatformAppStoreService } from 'services/platform-app-store';
import { NavigationService } from 'services/navigation';
import Utils from 'services/utils';
import BrowserView from 'components/shared/BrowserView';
import { GuestApiHandler } from 'util/guest-api-handler';
import remote from '@electron/remote';

@Component({
  components: { BrowserView },
})
export default class PlatformAppStore extends Vue {
  @Inject() userService: UserService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() platformAppStoreService: PlatformAppStoreService;
  @Inject() i18nService: I18nService;
  @Inject() navigationService: NavigationService;

  @Prop() params: {
    appId?: string;
  };

  onBrowserViewReady(view: Electron.BrowserView) {
    new GuestApiHandler().exposeApi(view.webContents.id, {
      reloadProductionApps: this.reloadProductionApps,
      openLinkInBrowser: this.openLinkInBrowser,
      onPaypalAuthSuccess: this.onPaypalAuthSuccessHandler,
      navigateToApp: this.navigateToApp,
    });

    view.webContents.on('did-finish-load', () => {
      if (Utils.isDevMode()) {
        view.webContents.openDevTools();
      }
    });
  }

  async onPaypalAuthSuccessHandler(callback: Function) {
    this.platformAppStoreService.bindsPaypalSuccessCallback(callback);
  }

  async openLinkInBrowser(url: string) {
    remote.shell.openExternal(url);
  }

  async reloadProductionApps() {
    this.platformAppsService.loadProductionApps();
  }

  get appStoreUrl() {
    return this.userService.appStoreUrl(this.params.appId);
  }

  async navigateToApp(appId: string) {
    this.navigationService.navigate('PlatformAppMainPage', { appId });
  }
}
