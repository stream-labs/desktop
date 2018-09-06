import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';
import { metadata } from 'components/widgets/inputs/index';
import { InheritMutations } from 'services/stateful-service';

export interface IChatBoxSettings extends IWidgetSettings {
  theme: string;
  background_color: string;
  text_color: string;
  show_moderator_icons: boolean;
  show_subscriber_icons: boolean;
  show_turbo_icons: boolean;
  show_premium_icons: boolean;
  show_bits_icons: boolean;
  show_coin_icons: boolean;
  show_bttv_emotes: boolean;
  show_franker_emotes: boolean;
  show_smf_emotes: boolean;
  always_show_messages: boolean;
  hide_common_chat_bots: boolean;
  message_hide_delay: number;
  text_size: 14;
  muted_chatters: string;
  hide_commands: boolean;
}

export interface IChatBoxData extends IWidgetData {
  settings: IChatBoxSettings;
}

@InheritMutations()
export class ChatBoxService extends WidgetSettingsService<IChatBoxData> {

  static initialState: {isChatBox: boolean; data: any} = {
    isChatBox: true,
    data: null
  };

  getWidgetType() {
    return WidgetType.ChatBox;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/chat-box/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/chatbox`;
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
    ...CODE_EDITOR_TABS
  ];

  protected patchAfterFetch(data: IChatBoxData): IChatBoxData {
    // backend accepts and returns message_hide_delay in different precision
    data.settings.message_hide_delay = Math.round(data.settings.message_hide_delay / 1000);
    return data;
  }


}
