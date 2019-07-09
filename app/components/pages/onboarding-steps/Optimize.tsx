import TsxComponent from 'components/tsx-component';
import { Component, Prop } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import { Inject } from '../../../services/core/injector';
import { AutoConfigService, IConfigProgress } from '../../../services/auto-config';
import { $t } from 'services/i18n';

interface IConfigStepPresentation {
  description: string;
  summary: string;
  percentage?: number;
}

@Component({})
export default class Optimize extends TsxComponent<{ continue: Function }> {
  @Inject() autoConfigService: AutoConfigService;
  @Prop() continue: Function;

  stepInfo: IConfigStepPresentation;
  optimizing = false;

  optimize() {
    this.optimizing = true;
    this.autoConfigService.start(progress => {
      if (
        progress.event === 'starting_step' ||
        progress.event === 'progress' ||
        progress.event === 'stopping_step'
      ) {
        if (this.stepInfo.description === progress.description) {
          this.stepInfo.percentage = progress.percentage;
        } else {
          this.stepInfo = {
            description: progress.description,
            summary: this.summaryForStep(progress),
            percentage: progress.percentage,
          };
        }
      } else if (progress.event === 'done') {
        this.continue();
      }
    });
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

  summaryForStep(progress: IConfigProgress) {
    return {
      detecting_location: $t('Detecting your location ...'),
      location_found: $t('Detected %{continent}', { continent: progress.continent }),
      bandwidth_test: $t('Performing bandwidth test ...'),
      streamingEncoder_test: $t('Testing streaming encoder ...'),
      recordingEncoder_test: $t('Testing recording encoder ...'),
      checking_settings: $t('Attempting stream ...'),
      setting_default_settings: $t('Reverting to defaults ...'),
      saving_service: $t('Applying stream settings ...'),
      saving_settings: $t('Applying general settings ...'),
    }[progress.description];
  }

  render(h: Function) {
    let percentage = 0;
    if (this.optimizing && this.stepInfo) {
      percentage = ((this.steps.indexOf(this.stepInfo.description) + 1) / this.steps.length) * 100;
    }
    return (
      <OnboardingStep>
        <template slot="title">
          {this.optimizing ? $t('Optimize') : `${$t('Optimizing...')} ${percentage}%`}
        </template>
        <template slot="desc">
          {$t(
            "Click below and we'll analyze your internet speed and computer hardware to give you the best settings possible.",
          )}
        </template>
        <button class="button button--action button--lg" onClick={this.optimize}>
          {$t('Start')}
        </button>
      </OnboardingStep>
    );
  }
}
