import { CODE_EDITOR_TABS, IWidgetData, WidgetSettingsService } from './widget-settings';
import { IWSliderMetadata } from 'components/shared/widget-inputs/WSliderInput.vue';
import { IWListMetadata } from 'components/shared/widget-inputs/WListInput.vue';
import { WidgetType } from 'services/widgets';



export interface IChatBoxData extends IWidgetData {
  widget: {
    url: string;
    simulate: string;
  };
  settings: {
    theme: 'twitch';
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
    custom_enabled: boolean;
    custom_html: string;
    custom_js: string;
    custom_css: string;
  };
  custom_defaults: {
    html: string;
    js: string;
    css: string;
  };
}

export class ChatBoxService extends WidgetSettingsService<IChatBoxData> {

  getWidgetType() {
    return WidgetType.ChatBox;
  }

  getVersion() {
    return 5;
  }

  getWidgetUrl() {
    return `https://${ this.getHost() }/widgets/chat-box/v1?token=${this.getWidgetToken()}`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/chatbox`;
  }

  getMetadata() {
    return {
      theme: <IWListMetadata<string>>{
        options: [
          { description: 'Clean', value: 'standard' },
          { description: 'Boxed', value: 'boxed' },
          { description: 'Twitch', value: 'twitch' },
          { description: 'Old School', value: 'oldschool' },
          { description: 'Chunky', value: 'chunky' }
        ]
      },
      message_hide_delay: <IWSliderMetadata> {
        min: 0,
        max: 200
      }
    };
  }

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];

  protected patchData(data: IChatBoxData): IChatBoxData {
    // backend accepts and returns message_hide_delay in different precision
    data.settings.message_hide_delay = Math.round(data.settings.message_hide_delay / 1000);
    return data;
  }


}
