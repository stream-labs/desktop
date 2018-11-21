import { IWidgetData, IWidgetSettings, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';
import { $t } from 'services/i18n';
import { formMetadata } from 'components/shared/inputs';
import { metadata } from 'components/widgets/inputs';

export interface ISpinWheelSettings extends IWidgetSettings {
  resultColor: string;
  resultTemplate: string;
  rotationSpeed: number;
  slowRate: number;
  hideTimeout: number;
  categories: { color: string, prize: string }[];
  sections: { category: number, weight: number }[];
  font: string;
  fontColor: string;
  fontSize: number;
  fontWeight: number;
  labelText: { height: number, width: number };
  innerBorderWidth: number;
  outerBorderWidth: number;
  borderColor: string;
  ticker: { size: number, tone: string, url: string };
  centerImage: {
    border: { color: string, enabled: boolean, width: number },
    default: string,
    enabled: true,
    size: number
  };
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
    };
  }

  getMetadata() {
    return formMetadata({
      resultTemplate: metadata.textArea({ title: $t('Results Template') }),
      resultColor: metadata.color({ title: $t('Results Color') }),
      hideTimeout: metadata.slider({ title: $t('Hide Timeout'), min: 1, max: 100 }),
      rotationSpeed: metadata.number({ title: $t('Rotation Speed') }),
      slowRate: metadata.number({ title: $t('Slowdown Rate') }),
      fontFamily: metadata.fontFamily({ title: $t('Font') }),
      fontSize: metadata.fontSize({ title: $t('Font Size') }),
      fontColor: metadata.color({ title: $t('Font Color') }),
      fontWeight: metadata.slider({ title: $t('Font Weight'), min: 300, max: 900, interval: 100 }),
      labelHeight: metadata.slider({ title: $t('Label Height'), min: 1, max: 100 }),
      labelWidth: metadata.slider({ title: $t('Label Width'), min: 1, max: 100 }),
      borderColor: metadata.color({ title: $t('Border Color') }),
      innerBorderWidth: metadata.slider({ title: $t('Inner Border Width'), min: 1, max: 100 }),
      outerBorderWidth: metadata.slider({ title: $t('Outer Border Width'), min: 1, max: 100 }),
      tickerUrl: metadata.mediaGallery({ title: $t('Ticker Image') }),
      tickerSize: metadata.slider({ title: $t('Ticker Size'), min: 1, max: 100 }),
      tickerTone: metadata.sound({ title: $t('Ticker Tone') }),
      centerEnabled: metadata.toggle({ title: $t('Center Image Enabled') }),
      centerDefault: metadata.mediaGallery({ title: $t('Center Image') }),
      centerSize: metadata.slider({ title: $t('Center Image Size'), min: 1, max: 100 }),
      centerBorderEnabled: metadata.toggle({ title: $t('Center Image Border Enabled') }),
      centerBorderColor: metadata.color({ title: $t('Center Image Border Color') }),
      centerBorderWidth: metadata.slider({ title: $t('Center Image Border Width'), min: 1, max: 100 }),
    });
  }

  protected patchAfterFetch(data: any): ISpinWheelData {
    data.settings.categories = JSON.parse(data.settings.categories);
    data.settings.sections = JSON.parse(data.settings.sections);
    return data;
  }

  protected patchBeforeSend(settings: ISpinWheelSettings): any {
    const newSettings: any = { ...settings };
    newSettings.categories = JSON.stringify(settings.categories);
    newSettings.sections = JSON.stringify(settings.sections);
    return newSettings;
  }
}
