import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { PlatformAppsService, ILoadedApp } from 'services/platform-apps';

@Component({})
export default class InstalledApps extends Vue {
  @Inject() platformAppsService: PlatformAppsService;

  get installedApps() {
    // installed == production apps
    return this.platformAppsService.productionApps;
  }

  get enabledInstalledAppIds(): string[] {
    return this.installedApps.filter(app => app.enabled).map(app => app.id);
  }

  isEnabled(appId: string) {
    return this.enabledInstalledAppIds.includes(appId);
  }

  reload(appId: string) {
    this.platformAppsService.refreshApp(appId);
  }

  toggleEnable(app: ILoadedApp) {
    if (this.isEnabled(app.id)) this.platformAppsService.setEnabled(app.id, false);
    else this.platformAppsService.setEnabled(app.id, true);
  }

  noUnpackedVersionLoaded(appId: string) {
    return !this.platformAppsService.enabledApps.find(app => app.id === appId && app.unpacked);
  }
}
