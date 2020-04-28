import { Component } from 'vue-property-decorator';
import { Onboarding } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import styles from './Onboarding.m.less';

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;

  currentStep = 1;
  importedFromObs = false;
  processing = false;

  continue(importedObs?: boolean) {
    if (importedObs != null) this.importedFromObs = importedObs;
    this.proceed();
  }

  proceed() {
    if (this.processing) return;
    if (this.currentStep >= this.stepsState.length) return this.complete();

    this.currentStep = this.currentStep + 1;
  }

  complete() {
    this.onboardingService.finish();
  }

  setProcessing(bool: boolean) {
    this.processing = bool;
  }

  get stepsState() {
    return this.steps.map((step, index) => {
      // Work around a bug in Beacker Onboarding
      // TODO: Remove beaker from onboarding during redesign
      if (index + 1 === this.currentStep && step.requiresHack) {
        return { complete: true };
      }

      return { complete: index + 1 < this.currentStep };
    });
  }

  get steps() {
    return this.onboardingService.views.steps;
  }

  get singletonStep() {
    if (this.onboardingService.views.singletonStep) {
      const Component = this.onboardingService.views.singletonStep;
      return (
        <div>
          <div class={styles.container}>
            <Component
              continue={this.complete.bind(this)}
              setProcessing={this.setProcessing.bind(this)}
            />
          </div>
        </div>
      );
    }
  }

  render() {
    if (this.singletonStep) return this.singletonStep;

    return (
      <div>
        <div class={styles.container}>
          <Onboarding
            steps={this.stepsState}
            stepLocation="top"
            skippable={true}
            currentStep={this.currentStep}
            disableControls={this.processing || this.steps[this.currentStep - 1].disableControls}
            continueHandler={this.continue.bind(this)}
            completeHandler={this.complete.bind(this)}
            skipHandler={this.proceed.bind(this)}
            prevHandler={() => {}}
            hideBack={true}
            hideSkip={this.steps[this.currentStep - 1].hideSkip}
            hideButton={this.steps[this.currentStep - 1].hideButton}
          >
            {this.steps.map(step => step.element)}
          </Onboarding>
        </div>
      </div>
    );
  }
}
