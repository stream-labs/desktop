import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { StreamlabelsService, IStreamlabelSubscription } from 'services/streamlabels';
import { getDefinitions } from 'services/streamlabels/definitions';
import { UserService } from 'services/user';

export interface IStreamlabelsManagerSettings {
  statname: string;
}

export class StreamlabelsManager extends PropertiesManager {

  @Inject() streamlabelsService: StreamlabelsService;
  @Inject() userService: UserService;

  settings: IStreamlabelsManagerSettings;
  subscription: IStreamlabelSubscription;
  blacklist = ['read_from_file', 'file'];
  customUIComponent = 'StreamlabelProperties';


  destroy() {
    this.unsubscribe();
  }


  applySettings(settings: Dictionary<any>) {
    this.settings = {
      // Default to All-Time Top Donator
      statname: 'all_time_top_donator',
      ...this.settings,
      ...settings
    };

    this.refreshSubscription();
  }


  unsubscribe() {
    if (this.subscription) {
      this.streamlabelsService.unsubscribe(this.subscription);
    }
  }


  refreshSubscription() {
    this.unsubscribe();

    this.subscription = this.streamlabelsService.subscribe(this.settings.statname);

    this.obsSource.update({
      ...this.obsSource.settings,
      read_from_file: true,
      file: this.subscription.path
    });
  }

}
