import React from 'react';
import styles from './Onboarding.m.less';
import commonStyles from './Common.m.less';
import { Services } from 'components-react/service-provider';
import { useModule } from 'components-react/hooks/useModule';
import cx from 'classnames';
import { mutation } from 'components-react/store';
import { $t } from 'services/i18n';
import * as stepComponents from './steps';

export default function Onboarding() {
  const { currentStep, next, processing } = useModule(OnboardingModule).select();
  const Component = stepComponents[currentStep.component];

  return (
    <div className={styles.onboardingContainer}>
      {<TopBar />}
      <div className={styles.onboardingContent}>
        {/* TODO: Add back in scrollable */}
        {/* <Scrollable className={styles.scroll}> */}
        {/* <Component
          style="height: 100%;"
          continue={() => this.continue()}
          setProcessing={(processing: boolean) => this.setProcessing(processing)}
        /> */}
        <Component />
        {/* </Scrollable> */}
      </div>
      {(!currentStep.hideSkip || !currentStep.hideButton) && (
        <div className={styles.footer}>
          {!currentStep.hideSkip && (
            <button
              className={cx('button button--trans', commonStyles.onboardingButton)}
              onClick={next}
              disabled={processing}
            >
              {$t('Skip')}
            </button>
          )}
          {<ActionButton />}
        </div>
      )}
    </div>
  );
}

function TopBar() {
  const { stepIndex, preboardingOffset, singletonStep, steps } = useModule(
    OnboardingModule,
  ).select();

  if (stepIndex < preboardingOffset || singletonStep) {
    // TODO: Remove styles?
    return <div className={styles.topBarContainer} />;
  }

  const offset = preboardingOffset;
  const stepIdx = stepIndex - offset;
  const filteredSteps = steps.filter(step => !step.isPreboarding);

  return (
    <div className={styles.topBarContainer}>
      {filteredSteps.map((step, i) => {
        let stepClass;
        if (i === stepIdx) stepClass = styles.current;
        if (i < stepIdx) stepClass = styles.completed;
        if (i > stepIdx) stepClass = styles.incomplete;
        return (
          <div className={styles.topBarSegment} key={step.label}>
            <div className={cx(styles.topBarStep, stepClass)}>
              {i < stepIdx && <i className="icon-check-mark" />}
            </div>
            {i < filteredSteps.length - 1 && (
              <div className={cx(styles.topBarSeperator, stepClass)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionButton() {
  const { currentStep, next, processing } = useModule(OnboardingModule).select();

  if (currentStep.hideButton) return null;
  const isPrimeStep = currentStep.label === $t('Prime');
  return (
    <button
      className={cx('button button--action', commonStyles.onboardingButton, {
        ['button--prime']: isPrimeStep,
      })}
      onClick={() => next()}
      disabled={processing}
    >
      {isPrimeStep ? $t('Go Prime') : $t('Continue')}
    </button>
  );
}

export class OnboardingModule {
  state = {
    stepIndex: 0,
    processing: false,
  };

  get OnboardingService() {
    return Services.OnboardingService;
  }

  get steps() {
    return this.OnboardingService.views.steps;
  }

  get singletonStep() {
    return this.OnboardingService.views.singletonStep;
  }

  get currentStep() {
    return this.singletonStep ?? this.steps[this.state.stepIndex];
  }

  get preboardingOffset() {
    return this.steps.filter(step => step.isPreboarding).length;
  }

  setImportFromObs() {
    this.OnboardingService.setObsImport(true);
  }

  finish() {
    this.OnboardingService.actions.finish();
  }

  @mutation()
  next() {
    if (this.state.processing) return;

    if (this.state.stepIndex >= this.steps.length - 1 || this.singletonStep) {
      return this.finish();
    }

    this.state.stepIndex += 1;
  }

  @mutation()
  setProcessing(val: boolean) {
    this.state.processing = val;
  }
}
