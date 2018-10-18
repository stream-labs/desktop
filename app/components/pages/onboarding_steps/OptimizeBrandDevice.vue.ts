import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../../util/injector';
import { OnboardingService } from 'services/onboarding';
import { BrandDeviceService } from 'services/auto-config/brand-device';


@Component({})
export default class OptimizeBrandDevice extends Vue {

  @Inject() private onboardingService: OnboardingService;
  @Inject() private brandDeviceService: BrandDeviceService;

  status: '' | 'init' | 'pending' | 'fail' | 'success' = '';

  async mounted() {
    // load device info into state
    await this.brandDeviceService.fetchDeviceInfo();

    // suggest to use optimized setting if found
    if (this.hasOptimizedSettings) {
      this.status = 'init';
      return;
    }

    // otherwise go to auto-optimizer for generic devices
    this.onboardingService.skip();
  }

  get deviceName() {
    return this.brandDeviceService.state.urls && this.brandDeviceService.state.urls.name;
  }

  get hasOptimizedSettings() {
    return !!this.deviceName;
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
