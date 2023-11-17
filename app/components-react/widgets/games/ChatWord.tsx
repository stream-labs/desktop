import React from 'react';
import { TextInput, ColorInput, SliderInput } from 'components-react/shared/inputs';
import { metadata } from 'components-react/shared/inputs/metadata';
import { $t } from 'services/i18n';
import { IChatWordOptions } from '../GameWidget';

export default function ChatWordSettings(p: {
  gameSettings: IChatWordOptions;
  updateGameOption: (key: string) => (val: unknown) => void;
}) {
  return (
    <>
      <ColorInput
        label={$t('Misplaced Character Tile')}
        tooltip={$t(
          'Change the color of the tile to this color when a character is present in the word but is misplaced',
        )}
        value={p.gameSettings.character_misplaced_tile_color}
        onChange={p.updateGameOption('character_misplaced_tile_color')}
      />
      <ColorInput
        label={$t('Misplaced Character')}
        tooltip={$t(
          'Change the color of the character to this if it is present in the word but is misplaced',
        )}
        value={p.gameSettings.character_misplaced_color}
        onChange={p.updateGameOption('character_misplaced_color')}
      />
      <ColorInput
        label={$t('Correct Character Tile')}
        tooltip={$t(
          'Change the color of the tile to this color when a character is present in the correct location in the word',
        )}
        value={p.gameSettings.character_correct_tile_color}
        onChange={p.updateGameOption('character_correct_tile_color')}
      />
      <ColorInput
        label={$t('Correct Character')}
        tooltip={$t(
          'Change the color of the character to this if it is present in the correct location in the word',
        )}
        value={p.gameSettings.character_correct_color}
        onChange={p.updateGameOption('character_correct_colo')}
      />
      <ColorInput
        label={$t('Wrong Character Tile')}
        tooltip={$t(
          'Change the color of the tile to this color when a character is not present in the word',
        )}
        value={p.gameSettings.character_wrong_tile_color}
        onChange={p.updateGameOption('character_wrong_tile_color')}
      />
      <ColorInput
        label={$t('Wrong Character')}
        tooltip={$t('Change the color of the character to this if it is not present in the word')}
        value={p.gameSettings.character_wrong_color}
        onChange={p.updateGameOption('character_wrong_color')}
      />
      <TextInput
        label={$t('Chat Won Title')}
        value={p.gameSettings.chat_won_game_title}
        onChange={p.updateGameOption('chat_won_game_title')}
      />
      <TextInput
        label={$t('Chat Won')}
        tooltip={$t('Message displayed to let everyone know chat won')}
        value={p.gameSettings.chat_won_game_message}
        onChange={p.updateGameOption('chat_won_game_message')}
      />
      <TextInput
        label={$t('Chat Lost Title')}
        value={p.gameSettings.chat_lost_game_title}
        onChange={p.updateGameOption('chat_lost_game_title')}
      />
      <TextInput
        label={$t('Chat Lost')}
        tooltip={$t('Message displayed to let everyone know chat lost')}
        value={p.gameSettings.chat_lost_game_message}
        onChange={p.updateGameOption('chat_lost_game_message')}
      />
      <TextInput
        label={$t("Chat's Turn")}
        value={p.gameSettings.chat_turn_message}
        onChange={p.updateGameOption('chat_turn_message')}
      />
      <TextInput
        label={$t('Wrong Word Chosen Message')}
        tooltip={$t(
          "Message to let the chat know they chose the wrong word. The word will still get evaluated, it's just an announcement",
        )}
        value={p.gameSettings.chat_wrong_word_chosen}
        onChange={p.updateGameOption('chat_wrong_word_chosen')}
      />
      <TextInput
        label={$t('Invalid Response Message')}
        tooltip={$t(
          'Message to let the chat know that the chosen word is not valid. Reason for invalidation can include wrong character length and more',
        )}
        value={p.gameSettings.chat_response_invalid}
        onChange={p.updateGameOption('chat_response_invalid')}
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
