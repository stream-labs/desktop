import { IWidgetData, IWidgetSettings, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

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
}
export interface ICreditsData extends IWidgetData {
  themes: any;
  settings: ICreditsSettings;
}

@InheritMutations()
export class CreditsService extends WidgetSettingsService<ICreditsData> {

  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.Credits,
      url: `https://${ this.getHost() }/widgets/chat-box/v1/${this.getWidgetToken()}`,
      previewUrl: `https://${ this.getHost() }/widgets/end-credits?token=${this.getWidgetToken()}&simulate=1`,
      dataFetchUrl: `https://${ this.getHost() }/api/v5/slobs/widget/endcredits`,
      settingsSaveUrl: `https://${ this.getHost() }/api/v5/slobs/widget/endcredits`,
      settingsUpdateEvent: 'endCreditsSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true
    }
  }

}
