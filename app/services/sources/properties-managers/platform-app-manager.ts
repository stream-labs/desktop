import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { PlatformAppsService } from 'services/platform-apps';
import { Subscription } from 'rxjs/Subscription';
import * as obs from '../../../../obs-api';

export interface IPlatformAppManagerSettings {
  appId: string;
  appSourceId: string;
}

export class PlatformAppManager extends PropertiesManager {
  @Inject() platformAppsService: PlatformAppsService;

  blacklist = ['is_local_file'];

  customUIComponent = 'PlatformAppProperties';

  settings: IPlatformAppManagerSettings;

  loadSub: Subscription;
  reloadSub: Subscription;
  unloadSub: Subscription;

  init() {
    this.loadSub = this.platformAppsService.appLoad.subscribe(app => {
      // This is mostly an edge case, but this will reactive an old source
      // when the app is re-installed.
      if (app.manifest.id === this.settings.appId) {
        this.updateUrl();
      }
    });

    this.reloadSub = this.platformAppsService.appReload.subscribe(appId => {
      if (appId === this.settings.appId) {
        this.updateUrl();

        // Force an update, since the URL probably didn't change, so
        // the browser source won't automatically reload it
        (this.obsSource.properties.get('refreshnocache') as obs.IButtonProperty)
          .buttonClicked(this.obsSource);
      }
    });

    this.unloadSub = this.platformAppsService.appUnload.subscribe(appId => {
      if (appId === this.settings.appId) {
        this.updateUrl();
      }
    });
  }

  destroy() {
    this.loadSub.unsubscribe();
    this.reloadSub.unsubscribe();
    this.unloadSub.unsubscribe();
  }

  applySettings(settings: Dictionary<any>) {
    super.applySettings(settings);
    this.updateUrl();
  }

  updateUrl() {
    const url = this.platformAppsService.getPageUrlForSource(
      this.settings.appId,
      this.settings.appSourceId
    );

    // This app was uninstalled or unsubscribed to
    if (!url) {
      this.obsSource.update({ url: '' });
      return;
    }

    if (this.obsSource.settings['url'] !== url) {
      this.obsSource.update({ url });
    }
  }
}
