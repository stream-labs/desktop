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
  MacPermissions,
} from './onboarding-steps';
import { UserService } from 'services/user';
import { $t } from 'services/i18n';
import styles from './Onboarding.m.less';
import { RestreamService } from 'services/restream';
import { OS } from 'util/operating-systems';

interface IOnboardingStep {
  element: JSX.Element;
  disableControls: boolean;
  hideSkip: boolean;
  hideButton: boolean;
  requiresHack?: boolean;
}

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

  checkFbPageEnabled() {
    if (this.fbSetupEnabled !== null || !this.userService.isLoggedIn) return;
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
    if (importedObs != null) this.importedFromObs = importedObs;
    this.checkFbPageEnabled();
    this.proceed();
  }

  proceed() {
    if (this.processing) return;
    if (this.currentStep === this.stepsState.length) return this.complete();

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
    const steps: IOnboardingStep[] = [];

    if (process.platform === OS.Mac) {
      steps.push({
        element: (
          <MacPermissions
            slot={(steps.length + 1).toString()}
            continue={this.continue.bind(this)}
          />
        ),
        disableControls: false,
        hideSkip: true,
        hideButton: true,
      });
    }

    steps.push({
      element: <Connect slot={(steps.length + 1).toString()} continue={this.continue.bind(this)} />,
      disableControls: false,
      hideSkip: true,
      hideButton: true,
    });

    steps.push({
      element: (
        <ObsImport
          slot={(steps.length + 1).toString()}
          continue={this.continue.bind(this)}
          setProcessing={this.setProcessing.bind(this)}
        />
      ),
      disableControls: true,
      hideSkip: true,
      hideButton: true,
    });

    if (this.importedFromObs) {
      steps.push({
        element: <StreamlabsFeatures slot={(steps.length + 1).toString()} />,
        disableControls: false,
        hideSkip: true,
        hideButton: false,
        requiresHack: true,
      });
    } else {
      steps.push({
        element: <HardwareSetup slot={(steps.length + 1).toString()} />,
        disableControls: false,
        hideSkip: false,
        hideButton: false,
        requiresHack: true,
      });
    }

    if (this.noExistingSceneCollections) {
      steps.push({
        element: (
          <ThemeSelector
            slot={(steps.length + 1).toString()}
            continue={this.continue.bind(this)}
            setProcessing={this.setProcessing.bind(this)}
          />
        ),
        disableControls: false,
        hideSkip: false,
        hideButton: true,
      });
    }

    if (this.onboardingService.isTwitchAuthed) {
      steps.push({
        element: (
          <Optimize
            slot={(steps.length + 1).toString()}
            continue={this.continue.bind(this)}
            setProcessing={this.setProcessing.bind(this)}
          />
        ),
        disableControls: false,
        hideSkip: false,
        hideButton: true,
      });

      steps.push({
        element: (
          <Multistream slot={(steps.length + 1).toString()} continue={() => this.continue()} />
        ),
        disableControls: false,
        hideSkip: false,
        hideButton: true,
      });
    }

    if (this.onboardingService.isFacebookAuthed && this.fbSetupEnabled) {
      steps.push({
        element: (
          <FacebookPageCreation
            slot={(steps.length + 1).toString()}
            continue={this.continue.bind(this)}
          />
        ),
        disableControls: false,
        hideSkip: false,
        hideButton: true,
      });
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
