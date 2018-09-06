import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets/index';

export interface IDonationTickerSettings extends IWidgetSettings {
  background_color: string;
  font: string;
  font_color: string;
  font_color2: string;
  font_color3: string;
  font_size: number;
  font_weight: number;
  max_donation_age: number;
  max_donations: number;
  message_format: string;
  min_donation_amount: number;
  scroll_speed: number;
}

export interface IDonationTickerData extends IWidgetData {
  settings: IDonationTickerSettings;
}

export class DonationTickerService extends WidgetSettingsService<IDonationTickerData> {

  getWidgetType() {
    return WidgetType.DonationTicker;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/donation-ticker?token=${this.getWidgetToken()}&simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/ticker`;
  }

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS,
    { name: 'test' }
  ];

  protected patchAfterFetch(data: any): IDonationTickerData {
    // backend accepts and returns some numerical values as strings
    data.settings.font_size = parseInt(data.settings.font_size, 10);
    data.settings.font_weight = parseInt(data.settings.font_weight, 10);
    return data;
  }
}
