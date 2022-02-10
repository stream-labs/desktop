import React from 'react';
import { IWidgetState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t } from '../../services/i18n';
import { createBinding, SliderInput, SwitchInput } from '../shared/inputs';
import { IEmoteWallSettings } from 'services/widgets/settings/emote-wall';
import {metadata} from "../shared/inputs/metadata";

interface IEmoteWallState extends IWidgetState {
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

export function EmoteWall() {
  const { isLoading, bind, isComboRequired, updateComboRequired } = useEmoteWall();
  const secondsFormatter = metadata.seconds({ min: 1000, max: 6000 });

  // use 1 column layout
  return (
    <WidgetLayout>
      {!isLoading && (
        <>
          <SwitchInput label={$t('Enabled')} {...bind.enabled} />
          <SliderInput
            label={$t('Duration')}
            {...secondsFormatter}
            {...bind.emote_animation_duration}
          />
          <SliderInput label={$t('Emote Scale')} min={1} max={10} {...bind.emote_scale} />

          <SwitchInput
            label={$t('Combo Required')}
            value={isComboRequired}
            onChange={combo_required => updateComboRequired({ combo_required })}
          />
          {isComboRequired && (
            <InputWrapper nowrap={true}>
              <SliderInput label={$t('Combo Count')} min={2} max={100} {...bind.combo_count} />
              <SliderInput
                label={$t('Combo Timeframe')}
                {...secondsFormatter}
                {...bind.combo_timeframe}
              />
            </InputWrapper>
          )}

          <SwitchInput label={$t('Ignore Duplicates')} {...bind.ignore_duplicates} />
        </>
      )}
    </WidgetLayout>
  );
}

export class EmoteWallModule extends WidgetModule<IEmoteWallState> {
  bind = createBinding(
    () => this.settings,
    statePatch => this.updateSettings(statePatch),
  );

  get isComboRequired() {
    return this.settings?.combo_required;
  }

  updateComboRequired(statePatch: Partial<IEmoteWallSettings>) {
    this.updateSettings(statePatch);
  }
}

function useEmoteWall() {
  return useWidget<EmoteWallModule>();
}
