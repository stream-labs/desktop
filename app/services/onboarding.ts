import { StatefulService, mutation } from 'services/core/stateful-service';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import { Inject, ViewHandler } from 'services/core/';
import { SceneCollectionsService } from 'services/scene-collections';
import * as onboardingSteps from 'components/pages/onboarding-steps';
import TsxComponent from 'components/tsx-component';
import { OS } from 'util/operating-systems';
import { $t } from './i18n';
import { handleResponse } from 'util/requests';
import { getPlatformService, IPlatformCapabilityResolutionPreset } from './platforms';
import { OutputSettingsService } from './settings';
import { ObsImporterService } from './obs-importer';

enum EOnboardingSteps {
  MacPermissions = 'MacPermissions',
  Connect = 'Connect',
  ChooseYourAdventure = 'ChooseYourAdventure',
  ObsImport = 'ObsImport',
  HardwareSetup = 'HardwareSetup',
  ThemeSelector = 'ThemeSelector',
  Optimize = 'Optimize',
  Prime = 'Prime',
  PrimeExpiration = 'PrimeExpiration',
}

const ONBOARDING_STEPS = () => ({
  [EOnboardingSteps.MacPermissions]: {
    element: onboardingSteps.MacPermissions,
    disableControls: false,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
  },
  [EOnboardingSteps.Connect]: {
    element: onboardingSteps.Connect,
    disableControls: false,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
  },
  [EOnboardingSteps.ChooseYourAdventure]: {
    element: onboardingSteps.ChooseYourAdventure,
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
  },
  [EOnboardingSteps.ObsImport]: {
    element: onboardingSteps.ObsImport,
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    label: $t('Import'),
  },
  [EOnboardingSteps.HardwareSetup]: {
    element: onboardingSteps.HardwareSetup,
    disableControls: false,
    hideSkip: false,
    hideButton: false,
    label: $t('Set Up Mic and Webcam'),
  },
  [EOnboardingSteps.ThemeSelector]: {
    element: onboardingSteps.ThemeSelector,
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Add a Theme'),
  },
  [EOnboardingSteps.Optimize]: {
    element: onboardingSteps.Optimize,
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Optimize'),
  },
  [EOnboardingSteps.Prime]: {
    element: onboardingSteps.Prime,
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    label: $t('Prime'),
  },
  [EOnboardingSteps.PrimeExpiration]: {
    element: onboardingSteps.PrimeExpiration,
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    label: '',
  },
});

const THEME_METADATA = {
  1246: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/ea91062/ea91062.overlay',
  1248: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/3205db0/3205db0.overlay',
  668: 'https://cdn.streamlabs.com/marketplace/overlays/2116872/17f7cb5/17f7cb5.overlay',
  1144: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/dd96270/dd96270.overlay',
  1100: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0d2e611/0d2e611.overlay',
  1190: 'https://cdn.streamlabs.com/marketplace/overlays/8062844/4a0582e/4a0582e.overlay',
};

interface IOnboardingStep {
  element: typeof TsxComponent;
  disableControls: boolean;
  hideSkip: boolean;
  hideButton: boolean;
  label?: string;
  isPreboarding?: boolean;
}

interface IOnboardingOptions {
  isLogin: boolean; // When logging into a new account after onboarding
  isOptimize: boolean; // When re-running the optimizer after onboarding
  isSecurityUpgrade: boolean; // When logging in, display a special message
  // about our security upgrade.
  isHardware: boolean; // When configuring capture defaults
  isPrimeExpiration: boolean; // Only shown as a singleton step if prime is expiring soon
  isImport: boolean; // When users are importing from OBS
}

interface IOnboardingServiceState {
  options: IOnboardingOptions;
  importedFromObs: boolean;
  existingSceneCollections: boolean;
}

class OnboardingViews extends ViewHandler<IOnboardingServiceState> {
  get singletonStep(): IOnboardingStep {
    if (this.state.options.isLogin) return ONBOARDING_STEPS()[EOnboardingSteps.Connect];
    if (this.state.options.isOptimize) return ONBOARDING_STEPS()[EOnboardingSteps.Optimize];
    if (this.state.options.isHardware) return ONBOARDING_STEPS()[EOnboardingSteps.HardwareSetup];
    if (this.state.options.isImport) return ONBOARDING_STEPS()[EOnboardingSteps.ObsImport];
    if (this.state.options.isPrimeExpiration) {
      return ONBOARDING_STEPS()[EOnboardingSteps.PrimeExpiration];
    }
  }

  get steps() {
    const steps: IOnboardingStep[] = [];
    const userViews = this.getServiceViews(UserService);
    const isOBSinstalled = this.getServiceViews(ObsImporterService).isOBSinstalled();

    if (process.platform === OS.Mac) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.MacPermissions]);
    }

    steps.push(ONBOARDING_STEPS()[EOnboardingSteps.Connect]);

    if (userViews.isLoggedIn && !userViews.isPrime) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.Prime]);
    }

    if (isOBSinstalled) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.ChooseYourAdventure]);
    }

    if (this.state.importedFromObs && isOBSinstalled) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.ObsImport]);
    } else {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.HardwareSetup]);
    }

    if (
      !this.state.existingSceneCollections &&
      !this.state.importedFromObs &&
      ((userViews.isLoggedIn &&
        getPlatformService(userViews.platform.type).hasCapability('themes')) ||
        !userViews.isLoggedIn)
    ) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.ThemeSelector]);
    }

    if (userViews.isTwitchAuthed) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.Optimize]);
    }

    return steps;
  }
}

export class OnboardingService extends StatefulService<IOnboardingServiceState> {
  static initialState: IOnboardingServiceState = {
    options: {
      isLogin: false,
      isOptimize: false,
      isSecurityUpgrade: false,
      isHardware: false,
      isPrimeExpiration: false,
      isImport: false,
    },
    importedFromObs: false,
    existingSceneCollections: false,
  };

  localStorageKey = 'UserHasBeenOnboarded';

  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() outputSettingsService: OutputSettingsService;

  @mutation()
  SET_OPTIONS(options: Partial<IOnboardingOptions>) {
    Object.assign(this.state.options, options);
  }

  @mutation()
  SET_OBS_IMPORTED(val: boolean) {
    this.state.importedFromObs = val;
  }

  @mutation()
  SET_EXISTING_COLLECTIONS(val: boolean) {
    // this.state.existingSceneCollections = val;
  }

  async fetchThemeData(id: string) {
    const url = `https://overlays.streamlabs.com/api/overlay/${id}`;
    return await fetch(new Request(url)).then(handleResponse);
  }

  async fetchThemes() {
    return await Promise.all(Object.keys(THEME_METADATA).map(id => this.fetchThemeData(id)));
  }

  themeUrl(id: string) {
    return THEME_METADATA[id];
  }

  get views() {
    return new OnboardingViews(this.state);
  }

  get options() {
    return this.state.options;
  }

  get existingSceneCollections() {
    return !(
      this.sceneCollectionsService.loadableCollections.length === 1 &&
      this.sceneCollectionsService.loadableCollections[0].auto
    );
  }

  init() {
    this.SET_EXISTING_COLLECTIONS(this.existingSceneCollections);
  }

  setObsImport(val: boolean) {
    this.SET_OBS_IMPORTED(val);
  }

  // A login attempt is an abbreviated version of the onboarding process,
  // and some steps should be skipped.
  start(options: Partial<IOnboardingOptions> = {}) {
    const actualOptions: IOnboardingOptions = {
      isLogin: false,
      isOptimize: false,
      isSecurityUpgrade: false,
      isHardware: false,
      isPrimeExpiration: false,
      isImport: false,
      ...options,
    };

    this.SET_OPTIONS(actualOptions);
    this.navigationService.navigate('Onboarding');
  }

  // Ends the onboarding process
  finish() {
    localStorage.setItem(this.localStorageKey, 'true');

    // setup a custom resolution if the platform requires that
    const platformService = getPlatformService(this.userService.views.platform?.type);
    if (platformService && platformService.hasCapability('resolutionPreset')) {
      const { inputResolution, outputResolution } = platformService;
      this.outputSettingsService.setSettings({
        mode: 'Advanced',
        inputResolution,
        streaming: { outputResolution },
      });
    }

    this.navigationService.navigate('Studio');
  }

  get isTwitchAuthed() {
    return this.userService.isLoggedIn && this.userService.platform.type === 'twitch';
  }

  get isFacebookAuthed() {
    return this.userService.isLoggedIn && this.userService.platform.type === 'facebook';
  }

  startOnboardingIfRequired() {
    if (localStorage.getItem(this.localStorageKey)) {
      this.forceLoginForSecurityUpgradeIfRequired();
      return false;
    }

    this.start();
    return true;
  }

  forceLoginForSecurityUpgradeIfRequired() {
    if (!this.userService.isLoggedIn) return;

    if (!this.userService.apiToken) {
      this.start({ isLogin: true, isSecurityUpgrade: true });
    }
  }
}
