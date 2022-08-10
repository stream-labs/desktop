import React from 'react';
import { TextInput, ColorInput, SliderInput } from 'components-react/shared/inputs';
import { metadata } from 'components-react/shared/inputs/metadata';
import { $t } from 'services/i18n';
import { IChatWordOptions } from '../GameWidget';

export default function ChatWordSettings(p: {
  gameSettings: IChatWordOptions;
  updateGameOption: (key: string) => (val: unknown) => void;
}) {
  return <></>;
}
// "character_misplaced_tile_color": "#ffbe72",
// "character_misplaced_color": "#000000",

// "character_correct_tile_color": "#80f5d2",
// "character_correct_color": "#000000",

// "character_wrong_tile_color": "#e3e8eb",
// "character_wrong_color": "#000000",

// "chat_won_game_title": "Congratulations!",
// "chat_won_game_message": "You guessed right! The correct answer was indeed '{answer}'",

// "chat_lost_game_title": "Try again!",
// "chat_lost_game_message": "The correct answer was '{answer}'",

// "chat_turn_message": "Playing Chat's Turn",
// "chat_wrong_word_chosen": "Word did not match",

// "chat_response_invalid": "Provided word does not meet the criteria.",

// "game_ended_message_duration": 3000
