import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../util/injector';
import { OnboardingService } from '../../../services/onboarding';
import { AutoConfigService, IConfigProgress } from '../../../services/auto-config';
import { $t } from 'services/i18n';

interface IConfigStepPresentation {
  description: string;
  summary: string;
  percentage?: number;
}

@Component({})
export default class OptimizeB extends Vue {
  @Inject()
  onboardingService: OnboardingService;

  @Inject()
  autoConfigService: AutoConfigService;

  stepInfo: IConfigStepPresentation[] = [];

  done = false;

  next() {
    this.onboardingService.next();
  }

  mounted() {
    this.autoConfigService.start(progress => {
      if (
        progress.event === 'starting_step' ||
        progress.event === 'progress' ||
        progress.event === 'stopping_step'
      ) {
        const step = this.stepInfo.find(step => {
          return step.description === progress.description;
        });

        if (step) {
          step.percentage = progress.percentage;
        } else {
          this.stepInfo.push({
            description: progress.description,
            summary: this.summaryForStep(progress),
            percentage: progress.percentage,
          });
        }
      } else if (progress.event === 'done') {
        this.done = true;
      }
    });
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
}
