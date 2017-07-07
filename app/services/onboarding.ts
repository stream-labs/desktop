import { StatefulService, mutation } from './stateful-service';
import { NavigationService } from './navigation';
import { Inject } from './service';
import electron from '../vendor/electron';

type TOnboardingStep = 'Connect' | 'SelectWidgets';

interface IOnboardingServiceState {
  currentStep: string;
}

export class OnboardingService extends StatefulService<IOnboardingServiceState> {

  static initialState: IOnboardingServiceState = {
    currentStep: null
  };


  localStorageKey = 'UserHasBeenOnboarded';


  @Inject()
  navigationService: NavigationService;


  init() {
    this.startOnboardingIfRequired();
  }


  mounted() {
    // This is used for faking authentication in tests.  We have
    // to do this because Twitch adds a captcha when we try to
    // actually log in from integration tests.
    electron.ipcRenderer.on('testing-fakeAuth', () => {
      this.next();
    });
  }


  @mutation()
  SET_CURRENT_STEP(step: TOnboardingStep) {
    this.state.currentStep = step;
  }


  get currentStep() {
    return this.state.currentStep;
  }


  // Navigates to the next step.  This is very simple right
  // now because we only have 1 step.
  next() {
    if (this.currentStep === 'Connect') {
      this.SET_CURRENT_STEP('SelectWidgets');
    } else {
      this.finish();
    }
  }


  start() {
    this.SET_CURRENT_STEP('Connect');
    this.navigationService.navigate('Onboarding');
  }


  // Ends the onboarding process
  finish() {
    this.navigationService.navigate('Studio');
  }


  private startOnboardingIfRequired() {
    if (localStorage.getItem(this.localStorageKey)) return;

    localStorage.setItem(this.localStorageKey, 'true');
    this.start();
  }

}
