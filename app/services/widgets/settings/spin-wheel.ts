import { IWidgetData, IWidgetSettings, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

export interface ISpinWheelSettings extends IWidgetSettings {
  borderColor: string;
  categories: { color: string, prize: string }[];
  centerImage: {
    border: { color: string, enabled: boolean, width: number },
    default: string,
    enabled: true,
    size: number
  };
  font: string;
  fontColor: string;
  fontSize: number;
  fontWeight: number;
  hideTimeout: number;
  innerBorderWidth: number;
  labelText: { height: number, width: number };
  outerBorderWidth: number;
  resultColor: string;
  resultTemplate: string;
  rotationSpeed: number;
  sections: { category: number, weight: number }[];
  slowRate: number;
  ticker: { size: number, tone: string, url: string };
}

export interface ISpinWheelData extends IWidgetData { settings: ISpinWheelSettings; }

@InheritMutations()
export class SpinWheelService extends WidgetSettingsService<ISpinWheelData> {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.SpinWheel,
      url: `https://${ this.getHost() }/widgets/spin-wheel?token=${this.getWidgetToken()}`,
      previewUrl: `https://${ this.getHost() }/widgets/spin-wheel?token=${this.getWidgetToken()}&simulate=1`,
      dataFetchUrl: `https://${ this.getHost() }/api/v5/slobs/widget/wheel`,
      settingsSaveUrl: `https://${ this.getHost() }/api/v5/slobs/widget/wheel`,
      settingsUpdateEvent: 'spinwheelSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true
    }
  }
}
