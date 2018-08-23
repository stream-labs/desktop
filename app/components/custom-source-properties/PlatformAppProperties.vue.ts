import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISourceApi } from 'services/sources';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService } from 'services/platform-apps';
import { Inject } from 'util/injector';
import { IPlatformAppManagerSettings } from 'services/sources/properties-managers/platform-app-manager';

export default class PlatformAppProperties extends Vue {
  @Prop() source: ISourceApi;

  @Inject() navigationService: NavigationService;
  @Inject() platformAppsService: PlatformAppsService;

  get managerSettings() {
    return this.source.getPropertiesManagerSettings() as IPlatformAppManagerSettings;
  }

  get appId() {
    return this.managerSettings.appId;
  }

  get appName() {
    return this.platformAppsService.getApp(this.appId).manifest.name;
  }

}
