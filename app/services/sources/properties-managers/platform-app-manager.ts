import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { PlatformAppsService } from 'services/platform-apps';

export interface IPlatformAppManagerSettings {
  appId: string;
  appSourceId: string;
}

export class PlatformAppManager extends PropertiesManager {
  @Inject() platformAppsService: PlatformAppsService;

  blacklist = ['is_local_file'];

  customUIComponent = 'PlatformAppProperties';

  settings: IPlatformAppManagerSettings;

  applySettings(settings: Dictionary<any>) {
    super.applySettings(settings);
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
