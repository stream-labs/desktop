import { StatefulService } from 'services/stateful-service';
import { mutation } from 'services/stateful-service';

interface IPlatformAppStoreServiceState {
  paypalAuthCallback: Function;
}

export class PlatformAppStoreService extends
  StatefulService<IPlatformAppStoreServiceState> {

  static initialState: IPlatformAppStoreServiceState = {
    paypalAuthCallback: () => { }
  };

  paypalAuthCallback: Function;

  paypalAuthSuccess() {
    this.state.paypalAuthCallback();
  }

  bindsPaypalSuccessCallback(callback: Function) {
    this.BINDS_PAYPAL_SUCCESS_CALLBACK(callback);
  }

  @mutation()
  private BINDS_PAYPAL_SUCCESS_CALLBACK(callback: Function) {
    this.state.paypalAuthCallback = callback;
  }

}
