import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';

export interface ICreditsSettings extends IWidgetSettings {
  theme: string;
  credit_title: string;
  credit_subtitle: string;
  background_color: string;
  text_color: string;
  text_size: 14;
  muted_chatters: string;
  bits: boolean;
  subscribers: boolean;
  moderators: boolean;
  donations: boolean;
  followers: boolean;
  bits_change: string;
  donor_change: string;
  followers_change: string;
  mods_change: string;
  subscribers_change: string;
  delay_time: number;
  roll_speed: number;
  roll_time: number;
  loop_credits: boolean;
  custom_enabled: boolean;
  custom_css: string;
  custom_js: string;
  custom_html: string;
}
export interface ICreditsData extends IWidgetData {
  themes: any;
  settings: ICreditsSettings;
}

export class CreditsService extends WidgetSettingsService<ICreditsData> {

  getWidgetType() {
    return WidgetType.Credits;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/end-credits?token=${this.getWidgetToken()}&simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/endcredits`;
  }

  patchAfterFetch(data: any): ICreditsData {
    // transform platform types to simple booleans
    return data;
  }

  patchBeforeSend(settings: ICreditsSettings): any {
    // the API accepts an object instead of simple booleans for platforms
    return settings;
  }


  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];

}
