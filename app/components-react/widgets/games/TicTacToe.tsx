import React from 'react';
import { TextInput, ColorInput, SliderInput } from 'components-react/shared/inputs';
import { metadata } from 'components-react/shared/inputs/metadata';
import { $t } from 'services/i18n';
import { ITicTacToeOptions } from '../GameWidget';

export default function TicTacToeSettings(p: {
  gameSettings: ITicTacToeOptions;
  updateGameOption: (key: string) => (val: unknown) => void;
}) {
  return (
    <>
      <ColorInput
        label={$t('Background Color')}
        value={p.gameSettings.background_color}
        onChange={p.updateGameOption('background_color')}
      />
      <ColorInput
        label={$t('Border Color')}
        value={p.gameSettings.border_color}
        onChange={p.updateGameOption('border_color')}
      />
      <TextInput
        label={$t('Chat Marker')}
        tooltip={$t(
          "Marker used to display where chat played their turn. Please make sure it's not more than 1 character",
        )}
        value={p.gameSettings.chat_marker}
        onChange={p.updateGameOption('chat_marker')}
      />
      <TextInput
        label={$t("Chat's Turn")}
        tooltip={$t("Message to let everyone know that it's chat's turn to play")}
        value={p.gameSettings.chat_turn_message}
        onChange={p.updateGameOption('chat_turn_message')}
      />
      <ColorInput
        label={$t('Chat Marker Color')}
        value={p.gameSettings.chat_marker_color}
        onChange={p.updateGameOption('chat_marker_color')}
      />
      <ColorInput
        label={$t('Chat Win Color')}
        value={p.gameSettings.chat_win_marker_color}
        onChange={p.updateGameOption('chat_win_marker_color')}
      />
      <TextInput
        label={$t('AI Marker')}
        tooltip={$t(
          "Marker used to display where AI played it's turn. Please make sure it's not more than 1 character",
        )}
        value={p.gameSettings.ai_marker}
        onChange={p.updateGameOption('ai_marker')}
      />
      <TextInput
        label={$t("AI's Turn")}
        tooltip={$t("Message to let everyone know that it's AI's turn to play")}
        value={p.gameSettings.ai_turn_message}
        onChange={p.updateGameOption('ai_turn_message')}
      />
      <ColorInput
        label={$t('AI Marker Color')}
        value={p.gameSettings.ai_marker_color}
        onChange={p.updateGameOption('ai_marker_color')}
      />
      <ColorInput
        label={$t('AI Win Color')}
        value={p.gameSettings.ai_win_marker_color}
        onChange={p.updateGameOption('ai_win_marker_color')}
      />
      <TextInput
        label={$t('Chat Won')}
        tooltip={$t('Message displayed to let everyone know chat won')}
        value={p.gameSettings.chat_won_game_message}
        onChange={p.updateGameOption('chat_won_game_message')}
      />
      <TextInput
        label={$t('Chat Lost')}
        tooltip={$t('Message displayed to let everyone know chat lost')}
        value={p.gameSettings.chat_lost_game_message}
        onChange={p.updateGameOption('chat_lost_game_message')}
      />
      <TextInput
        label={$t('Draw Game')}
        tooltip={$t('Message displayed to let everyone know the game was a draw')}
        value={p.gameSettings.draw_game_message}
        onChange={p.updateGameOption('draw_game_message')}
      />
      <TextInput
        label={$t('Cannot Play Here')}
        tooltip={$t('Message to let chat know that they cannot play the current move')}
        value={p.gameSettings.cannot_play_here}
        onChange={p.updateGameOption('cannot_play_here')}
      />
      <SliderInput
        label={$t('Game End Message Duration')}
        tooltip={$t('Display the game ended message for these many seconds')}
        value={p.gameSettings.game_ended_message_duration}
        onChange={p.updateGameOption('game_ended_message_duration')}
        {...metadata.seconds({ min: 3000, max: 5000 })}
      />
    </>
  );
}
