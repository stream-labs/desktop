import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import styles from './Onboarding.m.less';
import { OS } from 'util/operating-systems';

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;

  currentStepIndex = 0;
  importedFromObs = false;
  processing = false;

  continue(importedObs?: boolean) {
    if (importedObs != null) this.importedFromObs = importedObs;
    this.proceed();
  }

  proceed() {
    if (this.processing) return;
    if (this.currentStepIndex >= this.steps.length - 1) return this.complete();

    this.currentStepIndex = this.currentStepIndex + 1;
  }

  complete() {
    this.onboardingService.finish();
  }

  setProcessing(bool: boolean) {
    this.processing = bool;
  }

  get preboardingOffset() {
    return this.steps.filter(step => step.isPreboarding).length;
  }

  get steps() {
    return this.onboardingService.views.steps;
  }

  get topBar() {
    const offset = this.preboardingOffset;
    return (
      <div>
        {this.steps
          .filter(step => !step.isPreboarding)
          .map((_step, i) => {
            if (i === this.currentStepIndex - offset) return <div class={styles.currentStep} />;
            if (i < this.currentStepIndex - offset) return <div class={styles.completedStep} />;
            return <div class={styles.incompleteStep} />;
          })}
      </div>
    );
  }

  get currentStep() {
    const Component = this.steps[this.currentStepIndex].element;
    return (
      <Component
        continue={this.complete.bind(this)}
        setProcessing={this.setProcessing.bind(this)}
      />
    );
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
        {this.currentStepIndex > this.preboardingOffset && this.topBar}
        <div class={styles.container}>{this.currentStep}</div>
      </div>
    );
  }
}
