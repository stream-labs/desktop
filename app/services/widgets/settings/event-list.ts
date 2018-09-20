import { IWidgetData, IWidgetSettings, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { metadata } from 'components/widgets/inputs/index';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

export interface IEventListSettings extends IWidgetSettings {
  animation_speed: number;
  background_color: string;
  bits_minimum: number;
  brightness: number;
  fade_time: number;
  flip_x: boolean;
  flip_y: boolean;
  font_family: string;
  hide_animation: string;
  host_show_auto_hosts: boolean;
  host_viewer_minimum: number;
  hue: number;
  keep_history: boolean;
  max_events: number;
  raid_raider_minimum: number;
  saturation: number;
  show_animation: string;
  show_bits: boolean;
  show_donations: boolean;
  show_eldonations: boolean;
  show_follows: boolean;
  show_gamewispresubscriptions: boolean;
  show_gamewispsubscriptions: boolean;
  show_hosts: boolean;
  show_justgivingdonations: boolean;
  show_merch: boolean;
  show_pledges: boolean;
  show_raids: boolean;
  show_redemptions: boolean;
  show_resubs: boolean;
  show_smfredemptions: boolean;
  show_sub_tiers: boolean;
  show_subscriptions: boolean;
  show_tiltifydonations: boolean;
  show_treats: boolean;
  text_color: string;
  text_size: number;
  theme: string;
  theme_color: string;
}

export interface IEventListData extends IWidgetData {
  themes: any;
  settings: IEventListSettings;
}

@InheritMutations()
export class EventListService extends WidgetSettingsService<IEventListData> {

  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.EventList,
      url: `https://${this.getHost()}/widgets/event-list/v1/${this.getWidgetToken()}`,
      previewUrl: `https://${ this.getHost() }/widgets/event-list/v1/${this.getWidgetToken()}?simulate=1`,
      dataFetchUrl: `https://${ this.getHost() }/api/v5/slobs/widget/eventlist`,
      settingsSaveUrl: `https://${ this.getHost() }/api/v5/slobs/widget/eventlist`,
      settingsUpdateEvent: 'eventListSettingsUpdate',
      testers: ['Follow', 'Subscription', 'Donation', 'Bits', 'Host']
    }
  }

  getMetadata() {
    return {
      theme: metadata.list({
        options: [
          { title: 'Clean', value: 'standard' },
          { title: 'Boxed', value: 'boxed' },
          { title: 'Twitch', value: 'twitch' },
          { title: 'Old School', value: 'oldschool' },
          { title: 'Chunky', value: 'chunky' }
        ]
      }),
      message_hide_delay: metadata.slider({
        min: 0,
        max: 200
      })
    };
  }

}
