import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { PlatformAppsService } from 'services/platform-apps';

export interface IPlatformAppManagerSettings {
  appId: string;
  appSourceId: string;
}

export class PlatformAppManager extends PropertiesManager {
  @Inject() platformAppsService: PlatformAppsService;

  blacklist = ['url', 'is_local_file'];

  customUIComponent = 'PlatformAppProperties';

  settings: IPlatformAppManagerSettings;
}
