import React, { useEffect, useState } from 'react';
import { useGoLiveSettings } from './useGoLiveSettings';
import { $t } from '../../../services/i18n';
import { useVuex } from '../../hooks';
import { CheckboxInput } from '../../shared/inputs';
import { Services } from '../../service-provider';
import { IEncoderProfile } from '../../../services/video-encoding-optimizations';
import InputWrapper from '../../shared/inputs/InputWrapper';

export default function OptimizedProfileSwitcher() {
  const { VideoEncodingOptimizationService } = Services;
  const { game } = useGoLiveSettings();
  const enabled = useVuex(() => VideoEncodingOptimizationService.state.useOptimizedProfile);

  function setEnabled(enabled: boolean) {
    VideoEncodingOptimizationService.actions.useOptimizedProfile(enabled);
  }

  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<IEncoderProfile | null>(null);

  useEffect(() => {
    loadAvailableProfiles();
  }, [game]);

  async function loadAvailableProfiles() {
    setIsLoading(true);
    setSelectedProfile(await VideoEncodingOptimizationService.fetchOptimizedProfile(game));
    setIsLoading(false);
  }

  const label =
    selectedProfile?.game !== 'DEFAULT'
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
