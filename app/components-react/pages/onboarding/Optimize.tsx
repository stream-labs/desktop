import { useModule } from 'components-react/hooks/useModule';
import { Services } from 'components-react/service-provider';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';
import React, { useState } from 'react';
import { IConfigProgress } from 'services/auto-config';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import { OnboardingModule } from './Onboarding';

interface IConfigStepPresentation {
  description: string;
  summary: string;
  percentage?: number;
}

export function Optimize() {
  const { AutoConfigService, VideoEncodingOptimizationService } = Services;
  const [optimizing, setOptimizing] = useState(false);
  const [stepInfo, setStepInfo] = useState<IConfigStepPresentation | null>(null);
  const steps = [
    'detecting_location',
    'location_found',
    'bandwidth_test',
    'streamingEncoder_test',
    'recordingEncoder_test',
    'checking_settings',
    'setting_default_settings',
    'saving_service',
    'saving_settings',
  ];
  const percentage =
    optimizing && stepInfo ? (steps.indexOf(stepInfo.description) + 1) / steps.length : 0;
  const { setProcessing, next } = useModule(OnboardingModule).select();

  function summaryForStep(progress: IConfigProgress) {
    return {
      detecting_location: $t('Detecting your location...'),
      location_found: $t('Detected %{continent}', { continent: progress.continent }),
      bandwidth_test: $t('Performing bandwidth test...'),
      streamingEncoder_test: $t('Testing streaming encoder...'),
      recordingEncoder_test: $t('Testing recording encoder...'),
      checking_settings: $t('Attempting stream...'),
      setting_default_settings: $t('Reverting to defaults...'),
      saving_service: $t('Applying stream settings...'),
      saving_settings: $t('Applying general settings...'),
    }[progress.description];
  }

  function optimize() {
    setOptimizing(true);
    setProcessing(true);

    const sub = AutoConfigService.configProgress.subscribe(progress => {
      if (
        progress.event === 'starting_step' ||
        progress.event === 'progress' ||
        progress.event === 'stopping_step'
      ) {
        if (stepInfo && stepInfo.description === progress.description) {
          stepInfo.percentage = progress.percentage;
        } else {
          setStepInfo({
            description: progress.description,
            summary: summaryForStep(progress)!,
            percentage: progress.percentage,
          });
        }
      } else if (progress.event === 'done') {
        // We also default on video encoding optimizations
        VideoEncodingOptimizationService.actions.useOptimizedProfile(true);

        setProcessing(false);
        sub.unsubscribe();
        next();
      } else {
        setProcessing(false);
      }
    });

    AutoConfigService.start();
  }

  return (
    <div>
      <h1 className={commonStyles.titleContainer}>
        {optimizing ? $t('Optimizing...') : $t('Optimize')}
      </h1>
      <div style={{ width: '60%', margin: 'auto', textAlign: 'center' }}>
        {$t(
          "Click below and we'll analyze your internet speed and computer hardware to give you the best settings possible.",
        )}
      </div>
      {optimizing ? (
        <div style={{ margin: 'auto', marginTop: 24, width: '80%' }}>
          <AutoProgressBar percent={percentage * 100} timeTarget={1000 * 60} />
          <span>{stepInfo && stepInfo.summary}</span>
        </div>
      ) : (
        <button
          className={commonStyles.optionCard}
          onClick={optimize}
          style={{ margin: 'auto', marginTop: 24 }}
        >
          <h2>{$t('Start')}</h2>
        </button>
      )}
    </div>
  );
}
