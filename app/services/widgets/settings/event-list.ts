import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets/index';
import { metadata } from 'components/widgets/inputs/index';

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

export class EventListService extends WidgetSettingsService<IEventListData> {

  getWidgetType() {
    return WidgetType.EventList;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/event-list/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/eventlist`;
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

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS,
    { name: 'test' }
  ];
}
