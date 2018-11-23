import { IWidgetData, IWidgetSettings, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';
import { authorizedHeaders } from 'util/requests';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';

export interface ICreditsSettings extends IWidgetSettings {
  theme: string;
  credit_title: string;
  credit_subtitle: string;
  background_color: string;
  font_color: string;
  font_size: 14;
  font: string;
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
      url: `https://${this.getHost()}/widgets/chat-box/v1/${this.getWidgetToken()}`,
      previewUrl: `https://${this.getHost()}/widgets/end-credits?token=${this.getWidgetToken()}&simulate=1`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/endcredits`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/endcredits`,
      settingsUpdateEvent: 'endCreditsSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
  testRollCredits() {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(`https://${this.getHost()}/api/v5/slobs/widget/test/endcredits`, {
      headers,
    });
    return fetch(request);
  }
}
