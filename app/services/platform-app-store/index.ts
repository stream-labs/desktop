import { Service } from 'services/service';

export class PlatformAppStoreService extends Service {
  paypalAuthCallback: Function = () => {};

  paypalAuthSuccess() {
    this.paypalAuthCallback();
  }

  bindsPaypalSuccessCallback(callback: Function) {
    this.paypalAuthCallback = callback;
  }
}
