import { WidgetSettingsService } from './widget-settings';
import { IWSliderMetadata } from 'components/shared/widget-inputs/WSliderInput.vue';
import { IWListMetadata } from 'components/shared/widget-inputs/WListInput.vue';



export interface IChatBoxSettings {
  widget: {
    url: string,
    simulate: string
  };
  settings: {
    theme: 'twitch',
    'background_color': string,
    'text_color': string,
    'show_moderator_icons': boolean,
    'show_subscriber_icons': boolean,
    'show_turbo_icons': boolean,
    'show_premium_icons': boolean,
    'show_bits_icons': boolean,
    'show_coin_icons': boolean,
    'show_bttv_emotes': boolean,
    'show_franker_emotes': boolean,
    'show_smf_emotes': boolean,
    'always_show_messages': boolean,
    'hide_common_chat_bots': boolean,
    'message_hide_delay': number,
    'text_size': 14,
    'muted_chatters': string,
    'hide_commands': true,
    'custom_enabled': true,
  };
  custom: {
    html: string,
    css: string,
    js: string
  };
}

export class ChatBoxService extends WidgetSettingsService<IChatBoxSettings> {


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
          { description: 'Old School', value: 'old_school' },
          { description: 'Chunky', value: 'chunky' }
        ]
      }
    };
  }

}
