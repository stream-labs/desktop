import { StatefulService, mutation } from 'services/core/stateful-service';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import { Inject, ViewHandler } from 'services/core/';
import { SceneCollectionsService } from 'services/scene-collections';
import { OS } from 'util/operating-systems';
import { $t } from './i18n';
import { jfetch } from 'util/requests';
import { getPlatformService } from './platforms';
import { OutputSettingsService } from './settings';
import { ObsImporterService } from './obs-importer';
import Utils from './utils';
import { RecordingModeService } from './recording-mode';
import * as remote from '@electron/remote';
import { Subject } from 'rxjs';
import { Stream } from 'stream';

enum EOnboardingSteps {
  MacPermissions = 'MacPermissions',
  StreamingOrRecording = 'StreamingOrRecording',
  Connect = 'Connect',
  PrimaryPlatformSelect = 'PrimaryPlatformSelect',
  FreshOrImport = 'FreshOrImport',
  ObsImport = 'ObsImport',
  HardwareSetup = 'HardwareSetup',
  ThemeSelector = 'ThemeSelector',
  Optimize = 'Optimize',
  Prime = 'Prime',
  Tips = 'Tips',
}

export const ONBOARDING_STEPS = () => ({
  [EOnboardingSteps.MacPermissions]: {
    component: 'MacPermissions',
    disableControls: false,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
    cond: () => process.platform === OS.Mac,
  },
  [EOnboardingSteps.StreamingOrRecording]: {
    component: 'StreamingOrRecording',
    disableControls: true,
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
  [EOnboardingSteps.PrimaryPlatformSelect]: {
    component: 'PrimaryPlatformSelect',
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
    cond: ({ isPartialSLAuth }: OnboardingStepContext) => isPartialSLAuth,
  },
  [EOnboardingSteps.FreshOrImport]: {
    component: 'FreshOrImport',
    disableControls: true,
    hideSkip: true,
    hideButton: true,
    isPreboarding: true,
    cond: ({ isObsInstalled, recordingModeEnabled }: OnboardingStepContext) =>
      isObsInstalled && !recordingModeEnabled,
  },
  [EOnboardingSteps.ObsImport]: {
    component: 'ObsImport',
    disableControls: true,
    hideSkip: false,
    hideButton: true,
    label: $t('Import'),
    cond: ({ importedFromObs, isObsInstalled }: OnboardingStepContext) =>
      importedFromObs && isObsInstalled,
  },
  [EOnboardingSteps.HardwareSetup]: {
    component: 'HardwareSetup',
    disableControls: false,
    hideSkip: false,
    hideButton: false,
    label: $t('Set Up Mic and Webcam'),
    cond: ({ importedFromObs }: OnboardingStepContext) => !importedFromObs,
  },
  [EOnboardingSteps.ThemeSelector]: {
    component: 'ThemeSelector',
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Add a Theme'),
    cond: ({
      isLoggedIn,
      existingSceneCollections,
      importedFromObs,
      recordingModeEnabled,
      platformSupportsThemes,
    }: OnboardingStepContext) =>
      !existingSceneCollections &&
      !importedFromObs &&
      !recordingModeEnabled &&
      ((isLoggedIn && platformSupportsThemes) || !isLoggedIn),
  },
  // Temporarily skip auto config until migration to new API
  // [EOnboardingSteps.Optimize]: {
  //   component: 'Optimize',
  //   disableControls: false,
  //   hideSkip: false,
  //   hideButton: true,
  //   label: $t('Optimize'),
  //   cond: ({ isTwitchAuthed, isYoutubeAuthed, recordingModeEnabled }: OnboardingStepContext) => isTwitchAuthed || isYoutubeAuthed || recordingModeEnabled,
  // },
  [EOnboardingSteps.Prime]: {
    component: 'Prime',
    disableControls: false,
    hideSkip: false,
    hideButton: true,
    label: $t('Ultra'),
  },
  [EOnboardingSteps.Tips]: {
    component: 'Tips',
    disableControls: false,
    hideSkip: true,
    hideButton: true,
    cond: ({ streamerKnowledgeMode }: OnboardingStepContext) =>
      [StreamerKnowledgeMode.BEGINNER, StreamerKnowledgeMode.INTERMEDIATE].includes(
        streamerKnowledgeMode,
      ),
  },
});

const THEME_METADATA = {
  FREE: {
    2560: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0a2acb8/0a2acb8.overlay',
    2559: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/6dcbf5f/6dcbf5f.overlay',
    2624: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/eeeb9e1/eeeb9e1.overlay',
    2657: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0697cee/0697cee.overlay',
    2656: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/59acc9a/59acc9a.overlay',
    2639: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/a1a4ab0/a1a4ab0.overlay',
  },
  PAID: {
    // Waves (paid version), free: 3216
    2183: 'https://cdn.streamlabs.com/marketplace/overlays/439338/8164789/8164789.overlay',
    // Esports Legacy (free)
    3010: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/30a5873/30a5873.overlay',
    // Scythe (paid version), free: 2561
    3287: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/de716b6/de716b6.overlay',
    // Neon Pixel (paid version), free: 2574
    1445: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/fdb4d16/fdb4d16.overlay',
    // Talon (paid version), free: 1207
    1289: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/c5f35e1/c5f35e1.overlay',
    // Halloween Nights (free)
    2682: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/1fbce2a/1fbce2a.overlay',
  },
};

interface OnboardingStepContext {
  streamerKnowledgeMode: StreamerKnowledgeMode | null;
  isPartialSLAuth: boolean;
  existingSceneCollections: boolean;
  isObsInstalled: boolean;
  recordingModeEnabled: boolean;
  importedFromObs: boolean;
  isLoggedIn: boolean;
  isUltra: boolean;
  platformSupportsThemes: boolean;
}

export interface IOnboardingStep {
  component: string;
  disableControls: boolean;
  hideSkip: boolean;
  hideButton: boolean;
  label?: string;
  isPreboarding?: boolean;
  cond?: (ctx: OnboardingStepContext) => boolean;
}

interface IOnboardingOptions {
  isLogin: boolean; // When logging into a new account after onboarding
  isOptimize: boolean; // When re-running the optimizer after onboarding
  // about our security upgrade.
  isHardware: boolean; // When configuring capture defaults
  isImport: boolean; // When users are importing from OBS
}

export enum StreamerKnowledgeMode {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}
interface IOnboardingServiceState {
  options: IOnboardingOptions;
  importedFromObs: boolean;
  existingSceneCollections: boolean;
  streamerKnowledgeMode: StreamerKnowledgeMode | null;
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
    if (this.state.options.isLogin) {
      if (this.getServiceViews(UserService).isPartialSLAuth) {
        return ONBOARDING_STEPS()[EOnboardingSteps.PrimaryPlatformSelect];
      }

      return ONBOARDING_STEPS()[EOnboardingSteps.Connect];
    }
    if (this.state.options.isOptimize) return ONBOARDING_STEPS()[EOnboardingSteps.Optimize];
    if (this.state.options.isHardware) return ONBOARDING_STEPS()[EOnboardingSteps.HardwareSetup];
    if (this.state.options.isImport) return ONBOARDING_STEPS()[EOnboardingSteps.ObsImport];
  }

  get steps() {
    const userViews = this.getServiceViews(UserService);
    const isOBSinstalled = this.getServiceViews(ObsImporterService).isOBSinstalled();
    const recordingModeEnabled = this.getServiceViews(RecordingModeService).isRecordingModeEnabled;

    const streamerKnowledgeMode = this.streamerKnowledgeMode;

    const { existingSceneCollections, importedFromObs } = this.state;
    const { isLoggedIn, isPrime: isUltra } = userViews;

    const ctx: OnboardingStepContext = {
      streamerKnowledgeMode,
      recordingModeEnabled,
      existingSceneCollections,
      importedFromObs,
      isLoggedIn,
      isUltra,
      isObsInstalled: isOBSinstalled,
      isPartialSLAuth: userViews.auth && userViews.isPartialSLAuth,
      platformSupportsThemes: getPlatformService(userViews.platform.type)?.hasCapability('themes'),
    };

    return this.getStepsForMode(streamerKnowledgeMode)(ctx);
  }

  getStepsForMode(mode: StreamerKnowledgeMode) {
    const { getSteps } = this;

    switch (mode) {
      case StreamerKnowledgeMode.BEGINNER:
        return getSteps([
          EOnboardingSteps.MacPermissions,
          EOnboardingSteps.StreamingOrRecording,
          EOnboardingSteps.Connect,
          EOnboardingSteps.PrimaryPlatformSelect,
          EOnboardingSteps.FreshOrImport,
          EOnboardingSteps.ObsImport,
          EOnboardingSteps.HardwareSetup,
          EOnboardingSteps.ThemeSelector,
          EOnboardingSteps.Prime,
          EOnboardingSteps.Tips,
        ]);
      case StreamerKnowledgeMode.INTERMEDIATE:
        /*
         * Yes, these are the same as beginner, only inner screens are supposed to differ,
         * but the one screen that was provided is currently disabled (Optimizer), and the
         * other one is yet to be implemented (Tips).
         * Nevertheless, this sets the foundation for future changes.
         */
        return getSteps([
          EOnboardingSteps.MacPermissions,
          EOnboardingSteps.StreamingOrRecording,
          EOnboardingSteps.Connect,
          EOnboardingSteps.PrimaryPlatformSelect,
          EOnboardingSteps.FreshOrImport,
          EOnboardingSteps.ObsImport,
          EOnboardingSteps.HardwareSetup,
          EOnboardingSteps.ThemeSelector,
          EOnboardingSteps.Prime,
          EOnboardingSteps.Tips,
        ]);
      case StreamerKnowledgeMode.ADVANCED:
        return getSteps([
          EOnboardingSteps.FreshOrImport,
          EOnboardingSteps.ObsImport,
          EOnboardingSteps.HardwareSetup,
          EOnboardingSteps.Prime,
        ]);
      default:
        return getSteps([
          EOnboardingSteps.MacPermissions,
          EOnboardingSteps.StreamingOrRecording,
          EOnboardingSteps.Connect,
          EOnboardingSteps.PrimaryPlatformSelect,
          EOnboardingSteps.FreshOrImport,
          EOnboardingSteps.ObsImport,
          EOnboardingSteps.HardwareSetup,
          EOnboardingSteps.ThemeSelector,
          EOnboardingSteps.Prime,
        ]);
    }
  }

  getSteps(stepNames: EOnboardingSteps[]) {
    return (ctx: OnboardingStepContext): IOnboardingStep[] => {
      const steps = stepNames.map(step => ONBOARDING_STEPS()[step]);

      return steps.reduce((acc, step: IOnboardingStep) => {
        if (!step.cond || (step.cond && step.cond(ctx))) {
          acc.push(step);
        }

        return acc;
      }, [] as IOnboardingStep[]);
    };
  }

  get streamerKnowledgeMode() {
    return this.state.streamerKnowledgeMode;
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
    streamerKnowledgeMode: null,
  };

  localStorageKey = 'UserHasBeenOnboarded';

  onboardingCompleted = new Subject();

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
    this.state.existingSceneCollections = val;
  }

  @mutation()
  SET_STREAMER_KNOWLEDGE_MODE(val: StreamerKnowledgeMode) {
    this.state.streamerKnowledgeMode = val;
  }

  async fetchThemeData(id: string) {
    const url = `https://overlays.streamlabs.com/api/overlay/${id}`;
    return jfetch<IThemeMetadata>(url);
  }

  async fetchThemes() {
    return await Promise.all(Object.keys(this.themeMetadata).map(id => this.fetchThemeData(id)));
  }

  get themeMetadata() {
    return this.userService.views.isPrime ? THEME_METADATA.PAID : THEME_METADATA.FREE;
  }

  themeUrl(id: number) {
    return this.themeMetadata[id];
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
    this.setExistingCollections();
  }

  setObsImport(val: boolean) {
    this.SET_OBS_IMPORTED(val);
  }

  setExistingCollections() {
    this.SET_EXISTING_COLLECTIONS(this.existingSceneCollections);
  }

  setStreamerKnowledgeMode(val: StreamerKnowledgeMode | null) {
    this.SET_STREAMER_KNOWLEDGE_MODE(val);
  }

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
    remote.session.defaultSession.flushStorageData();
    console.log('Set onboarding key successful.');

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
    this.onboardingCompleted.next();
  }

  get isTwitchAuthed() {
    return this.userService.isLoggedIn && this.userService.platform.type === 'twitch';
  }

  get isFacebookAuthed() {
    return this.userService.isLoggedIn && this.userService.platform.type === 'facebook';
  }

  startOnboardingIfRequired() {
    this.start();
    return true;
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
/*
import { createMachine, assign, actions } from 'xstate';
const onboardingMachine = createMachine(
  {
    id: 'onboarding',
    initial: 'starting',
    predictableActionArguments: true,
    context: {
      usageMode: null,
    },
    states: {
      starting: {
        on: {
          NEXT: [{ target: 'macPermissions', cond: 'isMac' }, { target: 'chooseOnboardingModes' }],
        },
      },
      macPermissions: {
        on: {
          NEXT: { target: 'chooseOnboardingModes' },
        },
      },
      chooseOnboardingModes: {
        initial: 'chooseUsageMode',
        states: {
          chooseUsageMode: {
            description: 'Choose Streaming or Recording Mode',
            on: {
              CHOOSE_STREAMING: {
                target: '.streaming',
                description: 'Choose Streaming Mode',
              },
              CHOOSE_RECORDING: {
                target: '.recording',
                description: 'Choose Recording Mode',
              },
            },
            states: {
              streaming: {
                always: '../chooseKnowledgeLevel',
              },
              recording: {
                always: '../chooseKnowledgeLevel',
              },
            },
          },
          chooseKnowledgeLevel: {
            description: 'Choose Streamer Knowledge Level',
            on: {
              CHOOSE_BEGINNER: '../beginnerOnboarding',
              CHOOSE_INTERMEDIATE: '../intermediateOnboarding',
              CHOOSE_ADVANCED: '../advancedOnboarding',
            },
          },
        },
      },
      loginOrSignup: {},
      beginnerOnboarding: {
        on: {
          NEXT: 'loginOrSignup',
        },
      },
      intermediateOnboarding: {},
      advancedOnboarding: {},
    },
  },
  {
    guards: {
      isMac: (context, event) => {
        return process.platform === OS.Mac;
      },
    },
  },
);
*/
