import React, { useEffect, useState } from 'react';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from '../../../services/i18n';
import { useVuex } from '../../hooks';
import { CheckboxInput } from '../../shared/inputs';
import { Services } from '../../service-provider';
import InputWrapper from '../../shared/inputs/InputWrapper';

export default function OptimizedProfileSwitcher() {
  const { VideoEncodingOptimizationService } = Services;
  const { game, optimizedProfile, updateSettings } = useGoLiveSettings();
  const enabled = useVuex(() => VideoEncodingOptimizationService.state.useOptimizedProfile, false);
  const actions = VideoEncodingOptimizationService.actions;

  function setEnabled(enabled: boolean) {
    VideoEncodingOptimizationService.actions.return.useOptimizedProfile(enabled);
  }

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailableProfiles();
  }, [game]);

  async function loadAvailableProfiles() {
    setIsLoading(true);
    const optimizedProfile = await actions.return.fetchOptimizedProfile(game);
    updateSettings({ optimizedProfile });
    setIsLoading(false);
  }

  const label =
    optimizedProfile?.game !== 'DEFAULT'
      ? $t('Use optimized encoder settings for %{game}', { game })
      : $t('Use optimized encoder settings');
  const tooltip = $t(
    'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, ' +
      'resolution may be changed for a better quality of experience',
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
