import { PersistentStatefulService } from './persistent-stateful-service';
import { mutation } from './stateful-service';

interface ICustomizationServiceState {
  nightMode: boolean;
  updateStreamInfoOnLive: boolean;
}

export class CustomizationService extends PersistentStatefulService<ICustomizationServiceState> {

  static defaultState: ICustomizationServiceState = {
    nightMode: true,
    updateStreamInfoOnLive: true
  };

  @mutation()
  SET_NIGHT_MODE(nightMode: boolean) {
    this.state.nightMode = nightMode;
  }

  @mutation()
  SET_UPDATE_STREAM_INFO_ON_LIVE(update: boolean) {
    this.state.updateStreamInfoOnLive = update;
  }

  set nightMode(val: boolean) {
    this.SET_NIGHT_MODE(val);
  }

  get nightMode() {
    return this.state.nightMode;
  }

  setUpdateStreamInfoOnLive(update: boolean) {
    this.SET_UPDATE_STREAM_INFO_ON_LIVE(update);
  }

}
