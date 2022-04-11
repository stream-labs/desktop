import React from 'react';
import { IWidgetState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t } from '../../services/i18n';
import {
  CheckboxInput,
  ColorInput,
  createBinding,
  FontSizeInput,
  ListInput,
  SliderInput,
  TextAreaInput,
} from '../shared/inputs';
import { Services } from '../service-provider';
import { Collapse } from 'antd';

interface IChatBoxState extends IWidgetState {
  data: {
    settings: {
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
      always_show_messages: boolean;
      hide_common_chat_bots: boolean;
      message_hide_delay: number;
      text_size: number;
      muted_chatters: string;
      hide_commands: boolean;
      disable_message_animations: boolean;
    };
  };
}

export function ChatBox() {
  const { isLoading, bind, themes, isTwitch } = useChatBox();
  return (
    <WidgetLayout>
      {!isLoading && (
        <>
          <ListInput label={$t('Theme')} options={themes} {...bind.theme} />

          <SliderInput
            label={$t('Message hide Delay')}
            min={1}
            max={10}
            {...bind.message_hide_delay}
          />

          <InputWrapper>
            <CheckboxInput
              label={$t('Disable Message Animations')}
              {...bind.disable_message_animations}
            />
          </InputWrapper>

          {isTwitch && <TwitchSettings />}

          <InputWrapper label={$t('Hide Characters')}>
            <CheckboxInput label={$t('Hide Common Chat Bots')} {...bind.hide_common_chat_bots} />
            <CheckboxInput label={$t('Hide commands starting with `!`')} {...bind.hide_commands} />
          </InputWrapper>

          <TextAreaInput label={$t('Muted Chatters')} {...bind.muted_chatters} />

          <Collapse bordered={false}>
            <Collapse.Panel header={$t('Font Settings')} key={1}>
              <ColorInput label={$t('Font Color')} {...bind.text_color} />
              <FontSizeInput label={$t('Font Size')} {...bind.text_size} />
            </Collapse.Panel>
          </Collapse>
        </>
      )}
    </WidgetLayout>
  );
}

function TwitchSettings() {
  const { bind } = useChatBox();

  return (
    <>
      <InputWrapper label={$t('Badges')}>
        <CheckboxInput label={$t('Show Moderator Badges')} {...bind.show_moderator_icons} />
        <CheckboxInput label={$t('Show Subscriber Badges')} {...bind.show_subscriber_icons} />
        <CheckboxInput label={$t('Show Turbo Badges')} {...bind.show_turbo_icons} />
        <CheckboxInput label={$t('Show Twitch Prime Badges')} {...bind.show_premium_icons} />
        <CheckboxInput label={$t('Show Bits Badges')} {...bind.show_bits_icons} />
        <CheckboxInput label={$t('Show Top Coin Holder Badges')} {...bind.show_coin_icons} />
      </InputWrapper>

      <InputWrapper label={$t('Extra Emotes')}>
        <CheckboxInput label={$t('Enable BetterTTV Emotes')} {...bind.show_bttv_emotes} />
        <CheckboxInput label={$t('Enable FrankerFaceZ Emotes')} {...bind.show_franker_emotes} />
      </InputWrapper>
    </>
  );
}

export class ChatBoxModule extends WidgetModule<IChatBoxState> {
  bind = createBinding(
    () => this.settings,
    statePatch => this.updateSettings(statePatch),
  );

  themes = [
    { label: 'Clean', value: 'clean' },
    { label: 'Boxed', value: 'boxed' },
    { label: 'Twitch', value: 'twitch' },
    { label: 'Old School', value: 'oldschool' },
    { label: 'Chunky', value: 'chunky' },
  ];

  isTwitch = Services.UserService.platform?.type === 'twitch';

  protected patchAfterFetch(data: any) {
    // backend accepts and returns message_hide_delay in different precision
    data.settings.message_hide_delay = Math.round(data.settings.message_hide_delay / 1000);
    return data;
  }
}

function useChatBox() {
  return useWidget<ChatBoxModule>();
}
