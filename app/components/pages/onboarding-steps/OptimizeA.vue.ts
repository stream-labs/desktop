import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../services/core/injector';
import { OnboardingService } from '../../../services/onboarding';

@Component({})
export default class OptimizeA extends Vue {
  @Inject()
  onboardingService: OnboardingService;

  next() {
    this.onboardingService.next();
  }

  skip() {
    this.onboardingService.skip();
  }
}
