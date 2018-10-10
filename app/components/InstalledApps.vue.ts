import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { PlatformAppsService, ILoadedApp } from 'services/platform-apps';

@Component({})
export default class InstalledApps extends Vue {
  @Inject() platformAppsService: PlatformAppsService;

  get installedApps() {
    return this.platformAppsService.state.installedApps.filter(app => !app.unpacked);
  }

  get loadedProductionAppIds(): string[] {
    return this.platformAppsService.state.loadedApps
      .filter(app => !app.unpacked)
      .map(app => app.id);
  }

  isEnabled(appId: string) {
    return this.loadedProductionAppIds.includes(appId);
  }

  reload(appId: string) {
    this.platformAppsService.reloadApp(appId);
  }

  toggleLoad(app: ILoadedApp) {
    if (this.isEnabled(app.id)) {
      this.platformAppsService.unloadApp(app.id);
    } else {
      this.platformAppsService.addApp(app);
    }
  }
}
