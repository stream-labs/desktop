import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { PlatformAppsService } from 'services/platform-apps';

@Component({})
export default class InstalledApps extends Vue {
  @Inject() platformAppsService: PlatformAppsService;

  get installedApps() {
    return this.platformAppsService.state.loadedApps.filter(app => !app.unpacked);
  }

  reload(appId: string) {
    this.platformAppsService.reloadApp(appId);
  }

  toggleEnable(appId: string) {
    this.platformAppsService.toggleEnableApp(appId);
  }
}
