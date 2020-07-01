import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import SmoothProgressBar from 'components/shared/SmoothProgressBar';
import { Inject } from 'services/core/injector';
import { AutoConfigService, IConfigProgress } from 'services/auto-config';
import { $t } from 'services/i18n';
import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
import commonStyles from './Common.m.less';

interface IConfigStepPresentation {
  description: string;
  summary: string;
  percentage?: number;
}

class OptimizeProps {
  continue: () => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({ props: createProps(OptimizeProps) })
export default class Optimize extends TsxComponent<OptimizeProps> {
  @Inject() autoConfigService: AutoConfigService;
  @Inject() videoEncodingOptimizationService: VideoEncodingOptimizationService;

  stepInfo: IConfigStepPresentation = null;
  optimizing = false;

  optimize() {
    this.optimizing = true;
    this.props.setProcessing(true);

    const sub = this.autoConfigService.configProgress.subscribe(progress => {
      if (
        progress.event === 'starting_step' ||
        progress.event === 'progress' ||
        progress.event === 'stopping_step'
      ) {
        if (this.stepInfo && this.stepInfo.description === progress.description) {
          this.stepInfo.percentage = progress.percentage;
        } else {
          this.stepInfo = {
            description: progress.description,
            summary: this.summaryForStep(progress),
            percentage: progress.percentage,
          };
        }
      } else if (progress.event === 'done') {
        // We also default on video encoding optimizations
        this.videoEncodingOptimizationService.actions.useOptimizedProfile(true);

        this.props.setProcessing(false);
        sub.unsubscribe();
        this.props.continue();
      } else {
        this.props.setProcessing(false);
      }
    });

    this.autoConfigService.start();
  }

  get steps() {
    return [
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
  }

  get percentage() {
    if (this.optimizing && this.stepInfo) {
      return (this.steps.indexOf(this.stepInfo.description) + 1) / this.steps.length;
    }
    return 0;
  }

  summaryForStep(progress: IConfigProgress) {
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

  render() {
    return (
      <div>
        <h1 class={commonStyles.titleContainer}>
          {this.optimizing
            ? `${$t('Optimizing...')} ${Math.floor(this.percentage * 100)}%`
            : $t('Optimize')}
        </h1>
        <div style="width: 60%; margin: auto; text-align: center;">
          {$t(
            "Click below and we'll analyze your internet speed and computer hardware to give you the best settings possible.",
          )}
        </div>
        {this.optimizing ? (
          <div style="margin: auto; margin-top: 24px; width: 80%;">
            <SmoothProgressBar value={this.percentage} timeLimit={1000 * 60} />
            <span>{this.stepInfo && this.stepInfo.summary}</span>
          </div>
        ) : (
          <button
            class={commonStyles.optionCard}
            onClick={this.optimize}
            style="margin: auto; margin-top: 24px;"
          >
            <h2>{$t('Start')}</h2>
          </button>
        )}
      </div>
    );
  }
}
