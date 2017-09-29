import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Connect from './onboarding_steps/Connect.vue';
import OptimizeA from './onboarding_steps/OptimizeA.vue';
import OptimizeB from './onboarding_steps/OptimizeB.vue';
import ObsImport from './onboarding_steps/ObsImport.vue';
import OptimizeC from './onboarding_steps/OptimizeC.vue';
import SuccessfullyImported from './onboarding_steps/SuccessfullyImported.vue';
import BrowseOverlays from './onboarding_steps/BrowseOverlays.vue';
import SelectWidgets from './onboarding_steps/SelectWidgets.vue';
import { OnboardingService } from '../../services/onboarding';
import { Inject } from '../../util/injector';

@Component({
  components: {
    Connect,
    OptimizeA,
    OptimizeB,
    ObsImport,
    OptimizeC,
    SuccessfullyImported,
    BrowseOverlays,
    SelectWidgets
  }
})
export default class Onboarding extends Vue {

  @Inject()
  onboardingService: OnboardingService;

  get currentView() {
    return this.onboardingService.currentStep;
  }

}
