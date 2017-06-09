import { StatefulService, mutation } from './stateful-service';

interface ICustomizationServiceState {
  nightMode: boolean;
}

export class CustomizationService extends StatefulService<ICustomizationServiceState> {

  // TODO: Saving and laoding of state
  static initialState = {
    nightMode: false
  } as ICustomizationServiceState;

  @mutation
  SET_NIGHT_MODE(nightMode: boolean) {
    this.state.nightMode = nightMode;
  }

  set nightMode(val: boolean) {
    this.SET_NIGHT_MODE(val);
  }

  get nightMode() {
    return this.state.nightMode;
  }

}
