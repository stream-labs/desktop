import { Service } from 'services/core/service';

export class PlatformAppStoreService extends Service {
  paypalAuthCallback: Function = () => {};

  paypalAuthSuccess() {
    this.paypalAuthCallback();
  }

  bindsPaypalSuccessCallback(callback: Function) {
    this.paypalAuthCallback = callback;
  }
}
