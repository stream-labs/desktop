import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { StreamlabelsService } from 'services/streamlabels';
import { getDefinitions } from 'services/streamlabels/definitions';
import { UserService } from 'services/user';

export interface IStreamlabelsManagerSettings {
  statname: string;
}

export class StreamlabelsManager extends PropertiesManager {

  @Inject() streamlabelsService: StreamlabelsService;
  @Inject() userService: UserService;

  settings: IStreamlabelsManagerSettings;
  filename: string;

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
    if (this.filename) {
      this.streamlabelsService.unsubscribe(this.filename);
    }
  }


  refreshSubscription() {
    this.unsubscribe();

    this.filename = this.streamlabelsService.subscribe(this.settings.statname);

    this.obsSource.update({
      ...this.obsSource.settings,
      read_from_file: true,
      file: this.streamlabelsService.getStreamlabelsPath(this.filename)
    });
  }

}
