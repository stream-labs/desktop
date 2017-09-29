import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../util/injector';
import { OnboardingService } from '../../../services/onboarding';
import { AutoConfigService, IConfigProgress } from '../../../services/auto-config';

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
      if ((progress.event === 'starting_step')
        || (progress.event === 'progress')
        || (progress.event === 'stopping_step')) {

        const step = this.stepInfo.find(step => {
          return step.description === progress.description;
        });

        if (step) {
          step.percentage = progress.percentage;
        } else {
          this.stepInfo.push({
            description: progress.description,
            summary: this.summaryForStep(progress),
            percentage: progress.percentage
          });
        }
      } else if (progress.event === 'done') {
        this.done = true;
      }
    });
  }

  summaryForStep(progress: IConfigProgress) {
    return {
      detecting_location: 'Detecting your location ...',
      location_found: `Detected ${progress.continent}`,
      bandwidth_test: 'Performing bandwidth test ...',
      streamingEncoder_test: 'Testing streaming encoder ...',
      recordingEncoder_test: 'Testing recording encoder ...',
      checking_settings: 'Attempting stream ...',
      setting_default_settings: 'Reverting to defaults ...',
      saving_service: 'Applying stream settings ...',
      saving_settings: 'Applying general settings ...'
    }[progress.description];
  }

}
