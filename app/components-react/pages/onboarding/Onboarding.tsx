import React from 'react';
import styles from './Onboarding.m.less';
import commonStyles from './Common.m.less';
import { Services } from 'components-react/service-provider';
import { injectState, useModule, mutation } from 'slap';
import cx from 'classnames';
import { $t } from 'services/i18n';
import * as stepComponents from './steps';
import Utils from 'services/utils';
import {IOnboardingStep, ONBOARDING_STEPS} from 'services/onboarding';
import Scrollable from 'components-react/shared/Scrollable';

export default function Onboarding() {
  const { currentStep, next, processing, finish } = useModule(OnboardingModule);

  // TODO: Onboarding service needs a refactor away from step index-based.
  // In the meantime, if we run a render cycle and step index is greater
  // than the total number of steps, we just need to end the onboarding
  // immediately. Render side effects are bad btw.
  if (currentStep == null) {
    finish();
    return <></>;
  }

  const Component = stepComponents[currentStep.component];

  return (
    <div className={styles.onboardingContainer}>
      {<TopBar />}
      <div className={styles.onboardingContent}>
        <Scrollable style={{ height: '100%' }}>
          <Component />
        </Scrollable>
      </div>
      {(!currentStep.hideSkip || !currentStep.hideButton) && (
        <div className={styles.footer}>
          {!currentStep.hideSkip && (
            <button
              className={cx('button button--trans', commonStyles.onboardingButton)}
              onClick={() => next(true)}
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
  );

  if (stepIndex < preboardingOffset || singletonStep) {
    return <div />;
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
  const { currentStep, next, processing } = useModule(OnboardingModule);

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
  state = injectState({
    stepIndex: 0,
    processing: false,
  });

  get OnboardingService() {
    return Services.OnboardingService;
  }

  get ReocrdingModeService() {
    return Services.RecordingModeService;
  }

  get steps() {
    return this.OnboardingService.views.steps;
  }

  get singletonStep() {
    return this.OnboardingService.views.singletonStep;
  }

  get currentStep(): IOnboardingStep {
    // Useful for testing in development
    if (Utils.env.SLD_FORCE_ONBOARDING_STEP) {
      return ONBOARDING_STEPS()[Utils.env.SLD_FORCE_ONBOARDING_STEP];
    }

    return this.singletonStep ?? this.steps[this.state.stepIndex];
  }

  get preboardingOffset() {
    return this.steps.filter(step => step.isPreboarding).length;
  }

  setRecordingMode() {
    this.ReocrdingModeService.setRecordingMode(true);
    this.ReocrdingModeService.setUpRecordingFirstTimeSetup();
  }

  setImportFromObs() {
    this.OnboardingService.setObsImport(true);
  }

  finish() {
    this.OnboardingService.actions.finish();
  }

  @mutation()
  next(isSkip = false) {
    if (this.state.processing) return;

    if (
      this.ReocrdingModeService.views.isRecordingModeEnabled &&
      this.currentStep.component === 'HardwareSetup' &&
      !this.OnboardingService.state.options.isHardware &&
      !isSkip
    ) {
      this.ReocrdingModeService.actions.addRecordingWebcam();
    }

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
