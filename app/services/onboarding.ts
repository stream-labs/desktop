import { StatefulService, mutation } from './stateful-service';
import { NavigationService } from './navigation';
import { Inject } from './service';

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
    // TODO: Uncomment this line when we are ready to
    // release the onboarding flow.  (Will break tests)
    // this.startOnboardingIfRequired();
  }


  @mutation
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


  // Ends the onboarding process
  finish() {
    this.navigationService.navigate('Studio');
  }


  private startOnboardingIfRequired() {
    if (localStorage.getItem(this.localStorageKey)) return;

    localStorage.setItem(this.localStorageKey, 'true');

    this.SET_CURRENT_STEP('Connect');
    this.navigationService.navigate('Onboarding');
  }

}
