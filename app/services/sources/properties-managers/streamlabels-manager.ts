import { PropertiesManager, TCustomProperty, ICustomListProperty } from './properties-manager';
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

  init() {
    if (!this.settings) {
      this.settings = {
        statname: 'all_time_top_donator'
      };
    }
    this.refreshSubscription();

    window['obsSource'] = this.obsSource;
  }


  destroy() {
    this.unsubscribe();
  }


  getCustomProperties(): TCustomProperty[] {
    const definitions = getDefinitions(this.userService.platform.type);
    const options: { value: string; description: string }[] = [];

    Object.values(definitions).forEach(category => {
      category.files.forEach(file => {
        options.push({
          value: file.name,
          description: file.label
        });
      });
    });

    return [
      {
        type: 'OBS_PROPERTY_LIST',
        value: this.settings.statname,
        name: 'streamlabelsStatname',
        enabled: true,
        visible: true,
        isCustom: true,
        description: 'Statistic',
        options
      }
    ];
  }


  setCustomProperty(property: TCustomProperty) {
    if (property.name === 'streamlabelsStatname') {
      this.settings.statname = property.value as string;
      this.refreshSubscription();
    }
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
