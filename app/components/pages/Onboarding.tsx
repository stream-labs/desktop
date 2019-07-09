import { Component, Prop } from 'vue-property-decorator';
import { Onboarding } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import Connect from './onboarding-steps/Connect';
import ObsImport from './onboarding-steps/ObsImport';
import StreamlabsFeatures from './onboarding-steps/StreamlabsFeatures';
import Optimize from './onboarding-steps/Optimize';

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

    this.currentStep = this.currentStep + 1;
  }

  complete() {
    return;
  }

  render(h: Function) {
    const remainingSteps = this.importedFromObs
      ? [<StreamlabsFeatures slot="3" />]
      : [<Optimize slot="3" continue={() => this.continue()} />, <div slot="4" />];

    if (this.params.isLogin) {
      return (
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          <Connect slot="1" />
        </div>
      );
    }

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
          <ObsImport
            slot="2"
            continue={(importedFromObs: boolean) => this.continue(importedFromObs)}
          />
          {remainingSteps}
        </Onboarding>
      </div>
    );
  }
}
