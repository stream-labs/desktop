import React from 'react';
import { IWidgetCommonState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import { $t } from '../../services/i18n';
import { metadata } from '../shared/inputs/metadata';
import FormFactory from 'components-react/shared/inputs/FormFactory';

interface IChatBoxState extends IWidgetCommonState {
  data: {
    settings: {
      combo_count: number;
      combo_required: boolean;
      combo_timeframe: number; // milliseconds
      emote_animation_duration: number; // milliseconds
      emote_scale: number;
      enabled: boolean;
      ignore_duplicates: boolean;
    };
  };
}

export function ChatBox() {
  const { isLoading, settings, meta, updateSetting } = useChatBox();

  // use 1 column layout
  return (
    <WidgetLayout>
      {!isLoading && <FormFactory metadata={meta} values={settings} onChange={updateSetting} />}
    </WidgetLayout>
  );
}

export class ChatBoxModule extends WidgetModule<IChatBoxState> {
  get meta() {
    return {
      theme: metadata.list({
        options: [
          { label: 'Clean', value: 'clean' },
          { label: 'Boxed', value: 'boxed' },
          { label: 'Twitch', value: 'twitch' },
          { label: 'Old School', value: 'oldschool' },
          { label: 'Chunky', value: 'chunky' },
        ],
      }),
      always_show_messages: metadata.bool({ label: $t('Always Show Messages') }),
      message_hide_delay: metadata.slider({
        min: 0,
        max: 200,
        step: 1,
      }),
      message_show_delay: metadata.slider({
        min: 0,
        max: 6,
        step: 1,
      }),
      show_platform_icons: metadata.switch({ label: $t('Show Platform Icons') }),
      show_badges: {
        type: 'checkboxGroup',
        label: $t('Badges'),
        children: {
          show_moderator_icons: metadata.bool({ label: $t('Show Moderator Badges') }),
          show_subscriber_icons: metadata.bool({ label: $t('Show Subscriber Badges') }),
          show_turbo_icons: metadata.bool({ label: $t('Show Turbo Badges') }),
          show_premium_icons: metadata.bool({ label: $t('Show Twitch Prime Badges') }),
          show_bits_icons: metadata.bool({ label: $t('Show Bits Badges') }),
          show_coin_icons: metadata.bool({ label: $t('Show Top Coin Holder Badges') }),
        },
      },
      show_emotes: {
        type: 'checkboxGroup',
        label: $t('Extra Emotes'),
        children: {
          show_bttv_emotes: metadata.bool({ label: $t('Enable BetterTTV Emotes') }),
          show_franker_emotes: metadata.bool({ label: $t('Enable FrankerFaceZ Emotes') }),
          show_7tv_emotes: metadata.bool({ label: $t('Enable 7TV Emotes') }),
        },
      },
      text_color: metadata.color({
        label: $t('Text Color'),
        tooltip: $t('A hex code for the base text color.'),
      }),
      text_size: metadata.fontSize({ label: $t('Font Size'), min: 10, max: 80 }),
      muted_chatters: metadata.textarea({ label: $t('Muted Chatters') }),
      hide_commands: metadata.switch({ label: $t('Hide Commands') }),
      background_color: metadata.color({
        label: $t('Background Color'),
        tooltip: $t(
          'A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.',
        ),
      }),
    };
  }
}

function useChatBox() {
  return useWidget<ChatBoxModule>();
}
