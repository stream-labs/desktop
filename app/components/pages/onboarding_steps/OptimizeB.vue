<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-title">Optimize</div>
      <div class="onboarding-desc">We're analyzing your internet speed and computer hardware to give you the best settings possible.</div>

      <div class="running-setup-container optimizing">
        <div class="running-setup__deco running-setup__deco--right">
          <img src="../../../../media/images/decorations/right.gif" />
        </div>
        <div class="running-setup__deco running-setup__deco--left">
          <img src="../../../../media/images/decorations/left.gif" />
        </div>
        <div
          class="running-setup-row"
          v-for="step in stepInfo"
          :key="step.description">
          <div class="running-setup-title typing">{{ step.summary }}</div>
          <div
            v-if="step.percentage != null"
            class="running-setup-percent delay">
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
</script>

<style lang="less">
.typing {
  white-space: nowrap;
  overflow: hidden;
  text-align: left;
  // animation: typing 3s steps(30, end),
}

/* The typing effect */
@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

// .delay {
//   animation: 3s 0s delay;
// }

@keyframes delay {
  0% { opacity:0; }
  100% { opacity:0; }
}
</style>
