import React from 'react';
import { IWidgetState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t } from '../../services/i18n';
import {
  createBinding,
  SliderInput,
  SwitchInput,
} from '../shared/inputs';
import { IEmoteWallSettings } from 'services/widgets/settings/emote-wall';

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
  // use 1 column layout
  return (
    <WidgetLayout>
      {!isLoading && (
        <>
          <SwitchInput label={$t('Enabled')} {...bind.enabled} />
          <SliderInput label={$t('Duration')} min={1} max={60} {...bind.emote_animation_duration} />
          <SliderInput label={$t('Emote Scale')} min={1} max={10} {...bind.emote_scale} />

          <SwitchInput 
            label={$t('Combo Required')} 
            value={isComboRequired}
            onChange={combo_required => updateComboRequired({ combo_required })} 
          />          
          {isComboRequired && (
            <InputWrapper>
              <SliderInput label={$t('Combo Count')} min={2} max={100} {...bind.combo_count} />
              <SliderInput label={$t('Combo Timeframe')} min={1} max={60} {...bind.combo_timeframe} />
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

  patchAfterFetch(data: any): IEmoteWallState {
    // convert from milliseconds
    return {
      ...data,
      settings: {
        ...data.settings,
        combo_timeframe: data.settings.combo_timeframe / 1000,
        emote_animation_duration: data.settings.emote_animation_duration / 1000,
      },
    };
  }

  patchBeforeSend(settings: IEmoteWallState['data']['settings']): any {
    // convert to milliseconds
    return {
      ...settings,
      combo_timeframe: settings.combo_timeframe * 1000,
      emote_animation_duration: settings.emote_animation_duration * 1000,
    };
  }
}

function useEmoteWall() {
  return useWidget<EmoteWallModule>();
}
