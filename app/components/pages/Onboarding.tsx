import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import styles from './Onboarding.m.less';
import commonStyles from './onboarding-steps/Common.m.less';
import Scrollable from 'components/shared/Scrollable';

export class OnboardingStepProps {
  continue: () => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;

  currentStepIndex = 0;
  processing = false;

  continue() {
    if (this.processing) return;
    if (this.currentStepIndex >= this.steps.length - 1 || this.singletonStep) {
      return this.complete();
    }

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

  get singletonStep() {
    return this.onboardingService.views.singletonStep;
  }

  get currentStep() {
    if (this.singletonStep) return this.singletonStep;
    return this.steps[this.currentStepIndex];
  }

  get topBar() {
    if (this.currentStepIndex < this.preboardingOffset || this.singletonStep) {
      return <div class={styles.topBarContainer} />;
    }
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

  get button() {
    if (this.currentStep.hideButton) return null;
    const isPrimeStep = this.currentStep.label === $t('Prime');
    return (
      <button
        class={cx('button button--action', commonStyles.onboardingButton, {
          ['button--prime']: isPrimeStep,
        })}
        onClick={() => this.continue()}
        disabled={this.processing}
      >
        {isPrimeStep ? $t('Go Prime') : $t('Continue')}
      </button>
    );
  }

  render() {
    const Component = this.currentStep.element;

    return (
      <div class={styles.onboardingContainer}>
        {this.topBar}
        <div class={styles.onboardingContent}>
          <Scrollable className={styles.scroll}>
            <Component
              style="height: 100%;"
              continue={() => this.continue()}
              setProcessing={(processing: boolean) => this.setProcessing(processing)}
            />
          </Scrollable>
        </div>
        {(!this.currentStep.hideSkip || !this.currentStep.hideButton) && (
          <div class={styles.footer}>
            {!this.currentStep.hideSkip && (
              <button
                class={cx('button button--trans', commonStyles.onboardingButton)}
                onClick={() => this.continue()}
                disabled={this.processing}
              >
                {$t('Skip')}
              </button>
            )}
            {this.button}
          </div>
        )}
      </div>
    );
  }
}
