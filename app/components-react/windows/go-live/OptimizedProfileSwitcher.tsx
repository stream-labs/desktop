import React from 'react';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from '../../../services/i18n';
import { CheckboxInput } from '../../shared/inputs';
import { Services } from '../../service-provider';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { injectLoading } from 'slap';

export default function OptimizedProfileSwitcher() {
  const { game, isLoading, enabled, setEnabled, label, tooltip } = useGoLiveSettings().extend(
    settings => {
      const { VideoEncodingOptimizationService } = Services;
      const actions = VideoEncodingOptimizationService.actions;

      return {
        state: injectLoading(),

        async load() {
          // TODO reload on game change
          const optimizedProfile = await actions.return.fetchOptimizedProfile(settings.game);
          settings.updateSettings({ optimizedProfile });
        },

        get enabled() {
          return VideoEncodingOptimizationService.state.useOptimizedProfile;
        },

        setEnabled(enabled: boolean) {
          actions.useOptimizedProfile(enabled);
        },

        tooltip: $t(
          'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, ' +
            'resolution may be changed for a better quality of experience',
        ),

        get label(): string {
          return settings.state.optimizedProfile?.game && settings.state.optimizedProfile?.game !== 'DEFAULT'
            ? $t('Use optimized encoder settings for %{game}', { game })
            : $t('Use optimized encoder settings');
        },
      };
    },
  );

  return (
    <InputWrapper>
      {isLoading && $t('Checking optimized setting for %{game}', { game })}
      {!isLoading && (
        <CheckboxInput value={enabled} onChange={setEnabled} label={label} tooltip={tooltip} />
      )}
    </InputWrapper>
  );
}
