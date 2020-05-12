import cx from 'classnames';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import styles from './Onboarding.m.less';
import { MagicLinkService } from 'services/magic-link';

export class OnboardingStepProps {
  continue: () => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;
  @Inject() magicLinkService: MagicLinkService;

  currentStepIndex = 0;
  processing = false;

  continue(skipped?: boolean) {
    if (this.processing) return;
    if (this.currentStepIndex >= this.steps.length - 1 || this.singletonStep) {
      return this.complete(skipped);
    }

    this.currentStepIndex = this.currentStepIndex + 1;
  }

  complete(skipped?: boolean) {
    if (!skipped) this.linkToPrime();
    this.onboardingService.finish();
  }

  async linkToPrime() {
    const isPrimeStep = this.currentStep.label === $t('Prime');

    if (isPrimeStep) {
      try {
        const link = await this.magicLinkService.getDashboardMagicLink('prime');
        electron.remote.shell.openExternal(link);
      } catch (e) {
        console.error('Error generating dashboard magic link', e);
      }
    }
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
        class={cx('button button--action', { ['button--prime']: isPrimeStep })}
        onClick={() => this.continue()}
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
        <Component
          continue={() => this.continue()}
          setProcessing={(processing: boolean) => this.setProcessing(processing)}
        />
        {(!this.currentStep.hideSkip || !this.currentStep.hideButton) && (
          <div class={styles.footer}>
            {!this.currentStep.hideSkip && (
              <button class="button button--trans" onClick={() => this.continue(true)}>
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
