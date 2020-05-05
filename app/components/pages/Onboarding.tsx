import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import styles from './Onboarding.m.less';

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
    // if (this.currentStepIndex <= this.preboardingOffset) return null;
    const offset = this.preboardingOffset;
    const stepIdx = this.currentStepIndex - offset;
    const filteredSteps = this.steps.filter(step => !step.isPreboarding);
    return (
      <div class={styles.topBarContainer}>
        {filteredSteps.map((_step, i) => {
          let stepClass;
          if (i === stepIdx) stepClass = styles.current;
          if (i < stepIdx) stepClass = styles.completed;
          if (i > stepIdx) stepClass = styles.incomplete;
          return (
            <div class={styles.topBarSegment}>
              <div class={cx(styles.topBarStep, stepClass)}>
                {i < stepIdx && <i class="icon-check-mark" />}
              </div>
              {i < filteredSteps.length - 1 && (
                <div class={cx(styles.topBarSeperator, stepClass)} />
              )}
            </div>
          );
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
    console.log(this.steps);

    return (
      <div>
        {this.topBar}
        <div class={styles.container}>{this.currentStep}</div>
      </div>
    );
  }
}
