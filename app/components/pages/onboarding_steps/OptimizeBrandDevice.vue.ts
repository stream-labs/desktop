import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../util/injector';
import { OnboardingService } from 'services/onboarding';
import { BrandDeviceService } from 'services/auto-config/brand-device';


@Component({})
export default class OptimizeBrandDevice extends Vue {

  @Inject() private onboardingService: OnboardingService;
  @Inject() private brandDeviceService: BrandDeviceService;

  status: 'init' | 'pending' | 'fail' | 'success' = 'init';

  get deviceName() {
    return this.brandDeviceService.state.urls && this.brandDeviceService.state.urls.name;
  }

  async install() {
    this.status = 'pending';
    const success = await this.brandDeviceService.startAutoConfig();

    if (!success) {
      this.status = 'fail';
      return;
    }

    this.status = 'success';
  }

  next() {
    this.onboardingService.next();
  }

  skip() {
    this.onboardingService.skip();
  }

}
