import { StatefulService, mutation } from './stateful-service';
import { NavigationService } from './navigation';
import { UserService } from './user';
import { Inject } from './service';
import electron from '../vendor/electron';

type TOnboardingStep =
  'Connect' |
  'SelectWidgets' |
  'OptimizeA' |
  'OptimizeB' |
  'OptimizeC';

interface IOnboardingServiceState {
  currentStep: TOnboardingStep;
  completedSteps: TOnboardingStep[];
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

const ONBOARDING_STEPS: Dictionary<IOnboardingStep> = {
  Connect: {
    isEligible: () => true,
    next: 'SelectWidgets'
  },

  SelectWidgets: {
    isEligible: service => {
      return service.userService.isLoggedIn();
    },
    next: 'OptimizeA'
  },

  OptimizeA: {
    isEligible: service => {
      return service.isTwitchAuthed;
    },
    next: 'OptimizeB'
  },

  OptimizeB: {
    isEligible: service => {
      return service.state.completedSteps.includes('OptimizeA');
    }
  }
};

export class OnboardingService extends StatefulService<IOnboardingServiceState> {

  static initialState: IOnboardingServiceState = {
    currentStep: null,
    completedSteps: []
  };


  localStorageKey = 'UserHasBeenOnboarded';


  @Inject()
  navigationService: NavigationService;

  @Inject()
  userService: UserService;


  init() {
    this.startOnboardingIfRequired();
  }


  mounted() {
    // This is used for faking authentication in tests.  We have
    // to do this because Twitch adds a captcha when we try to
    // actually log in from integration tests.
    electron.ipcRenderer.on('testing-fakeAuth', () => {
      this.COMPLETE_STEP('Connect');
      this.SET_CURRENT_STEP('SelectWidgets');
    });
  }


  @mutation()
  SET_CURRENT_STEP(step: TOnboardingStep) {
    this.state.currentStep = step;
  }


  @mutation()
  COMPLETE_STEP(step: TOnboardingStep) {
    this.state.completedSteps.push(step);
  }


  get currentStep() {
    return this.state.currentStep;
  }


  // Completes the current step and moves on to the
  // next eligible step.
  next() {
    this.COMPLETE_STEP(this.state.currentStep);
    this.goToNextStep(ONBOARDING_STEPS[this.state.currentStep].next);
  }

  // Skip the current step and move on to the next
  // eligible step.
  skip() {
    this.goToNextStep(ONBOARDING_STEPS[this.state.currentStep].next);
  }


  start() {
    this.SET_CURRENT_STEP('Connect');
    this.navigationService.navigate('Onboarding');
  }


  // Ends the onboarding process
  finish() {
    this.navigationService.navigate('Studio');
  }


  get isTwitchAuthed() {
    return this.userService.isLoggedIn() &&
      this.userService.platform.type === 'twitch';
  }


  private goToNextStep(step: TOnboardingStep) {
    if (!step) {
      this.finish();
      return;
    }

    const stepObj = ONBOARDING_STEPS[step];

    if (stepObj.isEligible(this)) {
      this.SET_CURRENT_STEP(step);
    } else {
      this.goToNextStep(stepObj.next);
    }
  }


  private startOnboardingIfRequired() {
    if (localStorage.getItem(this.localStorageKey)) return;

    localStorage.setItem(this.localStorageKey, 'true');
    this.start();
  }

}
