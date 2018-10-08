import { IWidgetData, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from '../widget-settings';
import { InheritMutations } from 'services/stateful-service';
import { IAlertBoxSettings, IAlertBoxApiSettings } from './alert-box-api';

const REGEX_TESTERS =  [
  'bit',
  'donation',
  'donordrive',
  'eldonation',
  'justgiving',
  'merch',
  'resub',
  'tiltify',
  'treat',
  'follow',
  'host',
  'raid'
];

export interface IAlertBoxData extends IWidgetData {
  settings: IAlertBoxSettings;
}

@InheritMutations()
export class AlertBoxService extends WidgetSettingsService<IAlertBoxData> {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.AlertBox,
      url: `https://${ this.getHost() }/widgets/alert-box?token=${this.getWidgetToken()}`,
      previewUrl: `https://${ this.getHost() }/widgets/alert-box?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox`,
      settingsUpdateEvent: 'alertBoxSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true
    }
  }

  protected patchAfterFetch(data: { settings: IAlertBoxApiSettings }): IAlertBoxData {

    return data;
  }

  protected patchBeforeSend(settings: IAlertBoxSettings): IAlertBoxApiSettings {

    return settings;
  }

  private triageSettings(settings: IAlertBoxApiSettings): any {
    const newSettings = {};
    
  }
}
