import { StatefulService, mutation } from 'services/core/stateful-service';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import { Inject, ViewHandler } from 'services/core/';
import { SceneCollectionsService } from 'services/scene-collections';
import TsxComponent from 'components/tsx-component';
import { OS } from 'util/operating-systems';
import { $t } from './i18n';
import { handleResponse, jfetch } from 'util/requests';
import { getPlatformService, IPlatformCapabilityResolutionPreset } from './platforms';
import { OutputSettingsService } from './settings';
import { ObsImporterService } from './obs-importer';
import Utils from './utils';

enum EOnboardingSteps {
  MacPermissions = 'MacPermissions',
  Connect = 'Connect',
  FreshOrImport = 'FreshOrImport',
  ObsImport = 'ObsImport',
  HardwareSetup = 'HardwareSetup',
  ThemeSelector = 'ThemeSelector',
  Optimize = 'Optimize',
  Prime = 'Prime',
}

export const ONBOARDING_STEPS = () => ({
  [EOnboardingSteps.MacPermissions]: {
    component: 'MacPermissions',
    disableControls: false,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
  },
  [EOnboardingSteps.Connect]: {
    component: 'Connect',
    disableControls: false,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
  },
  [EOnboardingSteps.FreshOrImport]: {
    component: 'FreshOrImport',
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
  },
  [EOnboardingSteps.ObsImport]: {
    component: 'ObsImport',
    disableControls: true,
    hideSkip: false,
    hideButton: true,
    label: $t('Import'),
  },
  [EOnboardingSteps.HardwareSetup]: {
    component: 'HardwareSetup',
    disableControls: false,
    hideSkip: false,
    hideButton: false,
    label: $t('Set Up Mic and Webcam'),
  },
  [EOnboardingSteps.ThemeSelector]: {
    component: 'ThemeSelector',
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Add a Theme'),
  },
  [EOnboardingSteps.Optimize]: {
    component: 'Optimize',
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Optimize'),
  },
  [EOnboardingSteps.Prime]: {
    component: 'Prime',
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Prime'),
  },
});

const THEME_METADATA = {
  2560: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0a2acb8/0a2acb8.overlay',
  2559: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/6dcbf5f/6dcbf5f.overlay',
  2624: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/eeeb9e1/eeeb9e1.overlay',
  2657: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0697cee/0697cee.overlay',
  2656: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/59acc9a/59acc9a.overlay',
  2639: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/a1a4ab0/a1a4ab0.overlay',
};

export interface IOnboardingStep {
  component: string;
  disableControls: boolean;
  hideSkip: boolean;
  hideButton: boolean;
  label?: string;
  isPreboarding?: boolean;
}

interface IOnboardingOptions {
  isLogin: boolean; // When logging into a new account after onboarding
  isOptimize: boolean; // When re-running the optimizer after onboarding
  // about our security upgrade.
  isHardware: boolean; // When configuring capture defaults
  isImport: boolean; // When users are importing from OBS
}

interface IOnboardingServiceState {
  options: IOnboardingOptions;
  importedFromObs: boolean;
  existingSceneCollections: boolean;
}

export interface IThemeMetadata {
  data: {
    id: number;
    name: string;
    custom_images: Dictionary<string>;
  };
}

class OnboardingViews extends ViewHandler<IOnboardingServiceState> {
  get singletonStep(): IOnboardingStep {
    if (this.state.options.isLogin) return ONBOARDING_STEPS()[EOnboardingSteps.Connect];
    if (this.state.options.isOptimize) return ONBOARDING_STEPS()[EOnboardingSteps.Optimize];
    if (this.state.options.isHardware) return ONBOARDING_STEPS()[EOnboardingSteps.HardwareSetup];
    if (this.state.options.isImport) return ONBOARDING_STEPS()[EOnboardingSteps.ObsImport];
  }

  get steps() {
    const steps: IOnboardingStep[] = [];
    const userViews = this.getServiceViews(UserService);
    const isOBSinstalled = this.getServiceViews(ObsImporterService).isOBSinstalled();

    if (process.platform === OS.Mac) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.MacPermissions]);
    }

    steps.push(ONBOARDING_STEPS()[EOnboardingSteps.Connect]);

    if (isOBSinstalled) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.FreshOrImport]);
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

    if (userViews.isLoggedIn && !userViews.isPrime) {
      steps.push(ONBOARDING_STEPS()[EOnboardingSteps.Prime]);
    }

    return steps;
  }
}

export class OnboardingService extends StatefulService<IOnboardingServiceState> {
  static initialState: IOnboardingServiceState = {
    options: {
      isLogin: false,
      isOptimize: false,
      isHardware: false,
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
    return jfetch<IThemeMetadata>(url);
  }

  async fetchThemes() {
    return await Promise.all(Object.keys(THEME_METADATA).map(id => this.fetchThemeData(id)));
  }

  themeUrl(id: number) {
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
      isHardware: false,
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
    // Useful for testing in dev env
    if (Utils.env.SLD_FORCE_ONBOARDING_STEP) {
      this.start();
      return true;
    }

    if (localStorage.getItem(this.localStorageKey)) {
      return false;
    }

    this.start();
    return true;
  }
}
