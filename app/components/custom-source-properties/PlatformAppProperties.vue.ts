import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISourceApi } from 'services/sources';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService } from 'services/platform-apps';
import { Inject } from 'util/injector';
import { IPlatformAppManagerSettings } from 'services/sources/properties-managers/platform-app-manager';
import { WindowsService } from 'services/windows';

@Component({})
export default class PlatformAppProperties extends Vue {
  @Prop() source: ISourceApi;

  @Inject() navigationService: NavigationService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() windowsService: WindowsService;

  get managerSettings() {
    return this.source.getPropertiesManagerSettings() as IPlatformAppManagerSettings;
  }

  navigateApp() {
    this.navigationService.navigate('PlatformAppContainer', { appId: this.appId });
    this.windowsService.closeChildWindow();
  }

  get appId() {
    return this.managerSettings.appId;
  }

  get app() {
    return this.platformAppsService.getApp(this.appId);
  }

  get appName() {
    return this.app ? this.app.manifest.name : '';
  }

  get isDev() {
    return this.platformAppsService.devMode;
  }

}
