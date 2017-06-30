import { PersistentStatefulService } from './persistent-stateful-service';
import { mutation } from './stateful-service';

interface ICustomizationServiceState {
  nightMode: boolean;
}

export class CustomizationService extends PersistentStatefulService<ICustomizationServiceState> {

  static defaultState: ICustomizationServiceState = {
    nightMode: false
  };

  @mutation()
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
