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
import { UserService } from 'services/user';

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() userService: UserService;

  currentStep = 1;
  importedFromObs = false;
  processing = false;
  fbSetupEnabled: boolean = null;

  stepsState = [{ complete: false }, { complete: false }, { complete: false }];

  checkFbPageEnabled() {
    if (this.fbSetupEnabled === null || !this.userService.isLoggedIn()) return;
    // This will do a second unnecessary fetch, but it's the only
    // way to be sure we have fetched features
    this.incrementalRolloutService.fetchAvailableFeatures().then(() => {
      if (this.incrementalRolloutService.featureIsEnabled(EAvailableFeatures.facebookOnboarding)) {
        this.fbSetupEnabled = true;
      } else {
        this.fbSetupEnabled = false;
      }
    });
  }

  continue(importedObs?: boolean) {
    this.checkFbPageEnabled();
    this.adjustStepsState(importedObs);

    this.proceed();
  }

  previous() {
    this.currentStep = this.currentStep - 1;
  }

  proceed() {
    if (this.currentStep === this.stepsState.length) {
      return this.complete();
    }

    this.stepsState[this.currentStep - 1].complete = true;
    this.currentStep = this.currentStep + 1;

    if (this.currentStep === this.stepsState.length) {
      this.stepsState[this.currentStep - 1].complete = true;
    }
  }

  complete() {
    this.onboardingService.finish();
  }

  setProcessing(bool: boolean) {
    this.processing = bool;
  }

  adjustStepsState(importedObs?: boolean) {
    if (importedObs === true) {
      this.importedFromObs = true;
      while (this.stepsState.length > 2) {
        this.stepsState.pop();
      }
      this.stepsState.push({ complete: false });
    } else if (importedObs === false) {
      this.importedFromObs = false;
      while (this.stepsState.length > 2) {
        this.stepsState.pop();
      }
      this.stepsState.push({ complete: false });
      if (
        this.onboardingService.isTwitchAuthed ||
        (this.onboardingService.isFacebookAuthed && this.fbSetupEnabled)
      ) {
        this.stepsState.push({ complete: false });
      }
    }
  }

  steps(h: Function) {
    const steps = [
      <Connect slot="1" continue={this.continue.bind(this)} />,
      <ObsImport
        slot="2"
        continue={this.continue.bind(this)}
        setProcessing={this.setProcessing.bind(this)}
      />,
    ];
    let currentSlot = 3;

    if (this.importedFromObs) {
      steps.push(<StreamlabsFeatures slot={String(currentSlot)} />);
      return steps;
    }
    steps.push(
      <ThemeSelector
        slot={String(currentSlot)}
        continue={this.continue.bind(this)}
        setProcessing={this.setProcessing.bind(this)}
      />,
    );
    currentSlot++;
    if (this.onboardingService.isTwitchAuthed) {
      steps.push(
        <Optimize
          slot={String(currentSlot)}
          continue={this.continue.bind(this)}
          setProcessing={this.setProcessing.bind(this)}
        />,
      );
    } else if (this.onboardingService.isFacebookAuthed && this.fbSetupEnabled) {
      steps.push(
        <FacebookPageCreation slot={String(currentSlot)} continue={this.continue.bind(this)} />,
      );
    }
    return steps;
  }

  render(h: Function) {
    const steps = this.steps(h);

    if (this.onboardingService.options.isLogin) {
      return (
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          <Connect continue={this.complete.bind(this)} />
        </div>
      );
    }

    return (
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <Onboarding
          steps={this.stepsState}
          stepLocation="top"
          skippable={true}
          currentStep={this.currentStep}
          disableControls={this.processing || this.currentStep === 2}
          continueHandler={this.continue.bind(this)}
          completeHandler={this.complete.bind(this)}
          skipHandler={this.proceed.bind(this)}
          prevHandler={this.previous.bind(this)}
          hideBack={true}
          hideSkip={this.currentStep === 2}
          hideButton={
            [1, 2, 4].includes(this.currentStep) ||
            (this.currentStep === 3 && !this.importedFromObs)
          }
        >
          {steps}
        </Onboarding>
      </div>
    );
  }
}
