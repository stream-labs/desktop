import React from 'react';
import { IWidgetState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import { $t } from '../../services/i18n';
import { TextInput, ColorInput, createBinding, SliderInput } from '../shared/inputs';

interface IGameWidgetState extends IWidgetState {
  data: {
    settings: {
      decision_poll_timer: number;
      trigger_command: string;
      current_game: 'tic-tac-toe';
      chat_response_timer: string;
      no_input_recieved_message: string;
      restarting_game_message: string;
      available_games: 'tic-tac-toe'[];
      game_options: {
        'tic-tac-toe': {
          background_color: string;
          border_color: string;
          chat_marker_color: string;
          ai_marker_color: string;
          chat_win_marker_color: string;
          ai_win_marker_color: string;
          chat_won_game_message: string;
          chat_lost_game_message: string;
          draw_game_message: string;
          chat_marker: string;
          ai_marker: string;
          game_ended_message_duration: number;
          chat_turn_message: string;
          ai_turn_message: string;
          cannot_play_here: string;
        };
      };
    };
  };
}

export function GameWidget() {
  const { isLoading, bind } = useGameWidget();
  return (
    <WidgetLayout>
      {!isLoading && (
        <>
          <SliderInput
            label={$t('Chat Decision Time')}
            {...bind.decision_poll_timer}
            min={0}
            max={10}
            divisor={1000}
          />
          <TextInput label={$t('Trigger Command')} {...bind.trigger_command} />
          <TextInput label={$t('Chat Response Timer')} {...bind.chat_response_timer} />
          <TextInput label={$t('No Input Recieved')} {...bind.no_input_recieved_message} />
          <TextInput label={$t('Restarting Game')} {...bind.restarting_game_message} />
          <ColorInput
            label={$t('Background Color')}
            {...bind.game_options['tic-tac-toe'].background_color}
          />
          <ColorInput
            label={$t('Border Color')}
            {...bind.game_options['tic-tac-toe'].border_color}
          />
          <TextInput label={$t('Chat Marker')} {...bind.game_options['tic-tac-toe'].chat_marker} />
          <TextInput
            label={$t("Chat's Turn")}
            {...bind.game_options['tic-tac-toe'].chat_turn_message}
          />
          <ColorInput
            label={$t('Chat Marker Color')}
            {...bind.game_options['tic-tac-toe'].chat_marker_color}
          />
          <ColorInput
            label={$t('Chat Win Color')}
            {...bind.game_options['tic-tac-toe'].chat_win_marker_color}
          />
          <TextInput label={$t('AI Marker')} {...bind.game_options['tic-tac-toe'].ai_marker} />
          <TextInput
            label={$t("AI's Turn")}
            {...bind.game_options['tic-tac-toe'].ai_turn_message}
          />
          <ColorInput
            label={$t('AI Marker Color')}
            {...bind.game_options['tic-tac-toe'].ai_marker_color}
          />
          <ColorInput
            label={$t('AI Win Color')}
            {...bind.game_options['tic-tac-toe'].ai_win_marker_color}
          />
          <TextInput
            label={$t('Chat Won')}
            {...bind.game_options['tic-tac-toe'].chat_won_message}
          />
          <TextInput
            label={$t('Chat Lost')}
            {...bind.game_options['tic-tac-toe'].chat_lost_message}
          />
          <TextInput
            label={$t('Draw Game')}
            {...bind.game_options['tic-tac-toe'].draw_game_message}
          />
          <TextInput
            label={$t('Cannot Play Here')}
            {...bind.game_options['tic-tac-toe'].cannot_play_here}
          />
          <SliderInput
            label={$t('Game Ended Message Duration')}
            {...bind.game_options['tic-tac-toe'].game_ended_message_duration}
            min={0}
            max={10}
            divisor={1000}
          />
        </>
      )}
    </WidgetLayout>
  );
}

export class GameWidgetModule extends WidgetModule<IGameWidgetState> {
  bind = createBinding(
    () => this.settings,
    statePatch => this.updateSettings(statePatch),
  );

  patchAfterFetch(data: any): IGameWidgetState {
    return { ...data };
  }

  patchBeforeSend(settings: IGameWidgetState['data']['settings']): any {
    return { ...settings };
  }
}

function useGameWidget() {
  return useWidget<GameWidgetModule>();
}
