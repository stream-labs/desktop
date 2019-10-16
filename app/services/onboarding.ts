import { StatefulService, mutation } from './core/stateful-service';
import { NavigationService } from './navigation';
import { UserService } from './user';
import { Inject } from './core/injector';
import { BrandDeviceService } from 'services/auto-config/brand-device';

type TOnboardingStep =
  | 'Connect'
  | 'OptimizeA'
  | 'OptimizeB'
  | 'OptimizeC'
  | 'OptimizeBrandDevice'
  | 'SceneCollectionsImport'
  | 'ObsImport'
  | 'FacebookPageCreation';

interface IOnboardingOptions {
  isLogin: boolean; // When logging into a new account after onboarding
  isOptimize: boolean; // When re-running the optimizer after onboarding
  isSecurityUpgrade: boolean; // When logging in, display a special message
  // about our security upgrade.
  isHardware: boolean; // When configuring capture defaults
}

interface IOnboardingServiceState {
  options: IOnboardingOptions;
}

// Represents a single step in the onboarding flow.
// Implemented as a linked list.
interface IOnboardingStep {
  // Whether this step should run.  The service is
  // passed in as an argument.
  isEligible: (service: OnboardingService) => boolean;

  // The next step in the flow
  next?: TOnboardingStep;
}

export class OnboardingService extends StatefulService<IOnboardingServiceState> {
  static initialState: IOnboardingServiceState = {
    options: {
      isLogin: false,
      isOptimize: false,
      isSecurityUpgrade: false,
      isHardware: false,
    },
  };

  localStorageKey = 'UserHasBeenOnboarded';

  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;
  @Inject() brandDeviceService: BrandDeviceService;

  @mutation()
  SET_OPTIONS(options: Partial<IOnboardingOptions>) {
    Object.assign(this.state.options, options);
  }

  get options() {
    return this.state.options;
  }

  // A login attempt is an abbreviated version of the onboarding process,
  // and some steps should be skipped.
  start(options: Partial<IOnboardingOptions> = {}) {
    const actualOptions: IOnboardingOptions = {
      isLogin: false,
      isOptimize: false,
      isSecurityUpgrade: false,
      isHardware: false,
      ...options,
    };

    this.SET_OPTIONS(actualOptions);
    this.navigationService.navigate('Onboarding');
  }

  // Ends the onboarding process
  finish() {
    localStorage.setItem(this.localStorageKey, 'true');
    this.navigationService.navigate('Studio');
  }

  get isTwitchAuthed() {
    return this.userService.isLoggedIn() && this.userService.platform.type === 'twitch';
  }

  get isFacebookAuthed() {
    return this.userService.isLoggedIn() && this.userService.platform.type === 'facebook';
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
    if (!this.userService.isLoggedIn()) return;

    if (!this.userService.apiToken) {
      this.start({ isLogin: true, isSecurityUpgrade: true });
    }
  }
}
