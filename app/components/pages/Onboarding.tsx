import { Component, Prop } from 'vue-property-decorator';
import { Onboarding, OnboardingStep } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import Connect from './onboarding-steps/Connect';
import ObsImport from './onboarding-steps/ObsImport';
import StreamlabsFeatures from './onboarding-steps/StreamlabsFeatures';

@Component({})
export default class OnboardingPage extends TsxComponent<{ params?: { isLogin?: boolean } }> {
  @Inject() onboardingService: OnboardingService;

  @Prop() params?: {
    isLogin?: boolean;
  };

  importedFromObs = false;
  currentStep = 1;

  async continue(importedObs?: boolean) {
    if (importedObs) {
      this.importedFromObs = true;
      await this.$nextTick();
    }
  }

  complete() {
    return;
  }

  render(h: Function) {
    const remainingSteps = this.importedFromObs
      ? [<StreamlabsFeatures slot="3" />]
      : [<div slot="3" />, <div slot="4" />, <div slot="5" />];
    return (
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <Onboarding
          steps={remainingSteps.length + 2}
          stepLocation="top"
          current={this.currentStep}
          skip={true}
          continueFunc={this.continue}
          completeFunc={this.complete}
        >
          <Connect slot="1" />
          <ObsImport slot="2" continue={() => this.continue()} />
          {remainingSteps}
        </Onboarding>
      </div>
    );
  }
}
