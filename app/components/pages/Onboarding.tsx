import { Component, Prop } from 'vue-property-decorator';
import { Onboarding } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import Connect from './onboarding-steps/Connect';
import ObsImport from './onboarding-steps/ObsImport';
import StreamlabsFeatures from './onboarding-steps/StreamlabsFeatures';
import Optimize from './onboarding-steps/Optimize';
import FacebookPageCreation from './onboarding-steps/FacebookPageCreation';
import ThemeSelector from './onboarding-steps/ThemeSelector';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { setTransparency } from '@streamlabs/game-overlay';

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  importedFromObs = false;
  currentStep = 1;
  fbSetupEnabled = false;

  mounted() {
    // This will do a second unnecessary fetch, but it's the only
    // way to be sure we have fetched features
    this.incrementalRolloutService.fetchAvailableFeatures().then(() => {
      if (this.incrementalRolloutService.featureIsEnabled(EAvailableFeatures.facebookOnboarding)) {
        this.fbSetupEnabled = true;
      }
    });
  }

  async continue(importedObs?: boolean) {
    if (importedObs) {
      this.importedFromObs = true;
      await this.$nextTick();
    }

    this.currentStep = this.currentStep + 1;
  }

  complete() {
    this.onboardingService.finish();
  }

  steps(h: Function) {
    const steps = [
      <Connect slot="1" continue={() => this.continue()} />,
      <ObsImport
        slot="2"
        continue={(importedFromObs: boolean) => this.continue(importedFromObs)}
      />,
    ];
    let currentSlot = 3;

    if (this.importedFromObs) {
      steps.push(<StreamlabsFeatures slot={String(currentSlot)} />);
      return steps;
    }
    steps.push(<ThemeSelector slot={String(currentSlot)} />);
    currentSlot++;
    if (this.onboardingService.isTwitchAuthed) {
      steps.push(<Optimize slot={String(currentSlot)} continue={() => this.continue()} />);
    } else if (this.onboardingService.isFacebookAuthed && this.fbSetupEnabled) {
      steps.push(
        <FacebookPageCreation slot={String(currentSlot)} continue={() => this.continue()} />,
      );
    }
    return steps;
  }

  render(h: Function) {
    const steps = this.steps(h);

    if (this.onboardingService.options.isLogin) {
      return (
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          <Connect continue={() => this.complete()} />
        </div>
      );
    }

    return (
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <Onboarding
          steps={steps.length}
          stepLocation="top"
          current={this.currentStep}
          skip={true}
          continueFunc={this.continue}
          completeFunc={this.complete}
          hideControls={this.currentStep < 3}
        >
          {steps}
        </Onboarding>
      </div>
    );
  }
}
