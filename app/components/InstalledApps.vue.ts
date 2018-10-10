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

  isEnabled(appId: string) {
    return this.platformAppsService.state.loadedApps.find(app => app.id === appId);
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
