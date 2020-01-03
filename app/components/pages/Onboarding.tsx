import { Component } from 'vue-property-decorator';
import { Onboarding } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services/core/injector';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { SceneCollectionsService } from 'services/scene-collections';
import {
  Connect,
  ObsImport,
  StreamlabsFeatures,
  HardwareSetup,
  ThemeSelector,
  Optimize,
  FacebookPageCreation,
  Multistream,
} from './onboarding-steps';
import { UserService } from 'services/user';
import { $t } from 'services/i18n';
import styles from './Onboarding.m.less';
import { RestreamService } from 'services/restream';

@Component({})
export default class OnboardingPage extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() userService: UserService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() restreamService: RestreamService;

  currentStep = 1;
  importedFromObs = false;
  processing = false;
  fbSetupEnabled: boolean = null;

  stepsState = [{ complete: false }, { complete: false }, { complete: false }];

  checkFbPageEnabled() {
    if (this.fbSetupEnabled !== null || !this.userService.isLoggedIn()) return;
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

  proceed() {
    if (this.processing) return;
    if (this.currentStep === this.stepsState.length) return this.complete();

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
    } else if (importedObs === false) {
      this.importedFromObs = false;
      if (this.noExistingSceneCollections) {
        this.stepsState.push({ complete: false });
      }
      if (
        this.onboardingService.isTwitchAuthed ||
        (this.onboardingService.isFacebookAuthed && this.fbSetupEnabled)
      ) {
        this.stepsState.push({ complete: false });
      }
      if (this.restreamService.canEnableRestream) {
        this.stepsState.push({ complete: false });
      }
    }
  }

  get steps() {
    const steps = [
      <Connect slot="1" continue={this.continue.bind(this)} />,
      <ObsImport
        slot="2"
        continue={this.continue.bind(this)}
        setProcessing={this.setProcessing.bind(this)}
      />,
    ];

    return this.addOptionalSteps(steps);
  }

  addOptionalSteps(steps: JSX.Element[]) {
    if (this.importedFromObs) {
      steps.push(<StreamlabsFeatures slot="3" />);
      return steps;
    }
    steps.push(<HardwareSetup slot="3" />);
    let nextStep = '4';
    if (this.noExistingSceneCollections) {
      steps.push(
        <ThemeSelector
          slot={nextStep}
          continue={this.continue.bind(this)}
          setProcessing={this.setProcessing.bind(this)}
        />,
      );
      nextStep = '5';
    }
    if (this.onboardingService.isTwitchAuthed) {
      steps.push(
        <Optimize
          slot={nextStep}
          continue={this.continue.bind(this)}
          setProcessing={this.setProcessing.bind(this)}
        />,
      );
      nextStep = `${Number(nextStep) + 1}`;
      steps.push(<Multistream slot={nextStep} continue={() => this.continue()} />);
    } else if (this.onboardingService.isFacebookAuthed && this.fbSetupEnabled) {
      steps.push(<FacebookPageCreation slot={nextStep} continue={this.continue.bind(this)} />);
    }
    return steps;
  }

  get loginPage() {
    return (
      <div>
        <div class={styles.container}>
          <Connect continue={this.complete.bind(this)} />
        </div>
      </div>
    );
  }

  get optimizePage() {
    return (
      <div>
        <div class={styles.container}>
          <Optimize
            continue={this.complete.bind(this)}
            setProcessing={this.setProcessing.bind(this)}
          />
        </div>
      </div>
    );
  }

  get hardwarePage() {
    return (
      <div>
        <div class={styles.container}>
          <HardwareSetup />
          <button class="button button--action" onClick={this.complete}>
            {$t('Complete')}
          </button>
        </div>
      </div>
    );
  }

  get noExistingSceneCollections() {
    return (
      this.sceneCollectionsService.collections.length === 1 &&
      this.sceneCollectionsService.collections[0].auto
    );
  }

  render() {
    if (this.onboardingService.options.isLogin) return this.loginPage;
    if (this.onboardingService.options.isOptimize) return this.optimizePage;
    if (this.onboardingService.options.isHardware) return this.hardwarePage;

    return (
      <div>
        <div class={styles.container}>
          <Onboarding
            steps={this.stepsState}
            stepLocation="top"
            skippable={true}
            currentStep={this.currentStep}
            disableControls={this.processing || this.currentStep === 2}
            continueHandler={this.continue.bind(this)}
            completeHandler={this.complete.bind(this)}
            skipHandler={this.proceed.bind(this)}
            prevHandler={() => {}}
            hideBack={true}
            hideSkip={
              [1, 2].includes(this.currentStep) || (this.currentStep === 3 && this.importedFromObs)
            }
            hideButton={
              [1, 2, 5, 6].includes(this.currentStep) ||
              (this.currentStep === 4 && !this.importedFromObs)
            }
          >
            {this.steps}
          </Onboarding>
        </div>
      </div>
    );
  }
}
