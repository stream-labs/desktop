<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-title">Optimize</div>
      <div class="onboarding-desc">We're analyzing your internet speed and computer hardware to give you the best settings possible.</div>

      <div class="running-setup-container optimizing">
        <div class="running-setup__deco running-setup__deco--right">
          <img src="../../../../media/images/decorations/right-running.png" />
        </div>
        <div class="running-setup__deco running-setup__deco--left">
          <img src="../../../../media/images/decorations/left-running.png" />
        </div>
        <div
          class="running-setup-row"
          v-for="step in stepInfo"
          :key="step.step">
          <div class="running-setup-title">{{ step.description }}</div>
          <div
            v-if="step.percentage != null"
            class="running-setup-percent">
            {{ step.percentage }}%
          </div>
        </div>

        <div v-if="done" class="running-setup-row">
          <div class="running-setup-title">Done!</div>
        </div>
      </div>
      <button
        class="button button--action button--lg"
        @click="next"
        :disabled="!done">
        Next
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../services/service';
import { OnboardingService } from '../../../services/onboarding';
import { AutoConfigService, TConfigStep, IConfigProgress } from '../../../services/auto-config';

interface IConfigStepPresentation {
  step: TConfigStep;
  description: string;
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
          return step.step === progress.step;
        });

        if (step) {
          step.percentage = progress.percentage;
        } else {
          this.stepInfo.push({
            step: progress.step,
            description: this.descriptionForStep(progress),
            percentage: progress.percentage
          });
        }
      } else if (progress.event === 'done') {
        this.done = true;
      }
    });
  }

  descriptionForStep(progress: IConfigProgress) {
    return {
      detecting_location: 'Detecting your location ...',
      location_found: `Detected ${progress.continent}`,
      bandwidth_test: 'Finding the best server ...',
      streamingEncoder_test: 'Testing streaming encoder ...',
      recordingEncoder_test: 'Testing recording encoder ...',
      saving_service: 'Applying stream settings ...',
      saving_settings: 'Applying general settings ...'
    }[progress.step];
  }

}
</script>
