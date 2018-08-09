import { Service } from './service';
import Util from 'services/utils';

// Hands out hostnames to the rest of the app. Eventually
// we should allow overriding this value. But for now we
// are just keeping the value in one place.
export class HostsService extends Service {

  get streamlabs() {
    return 'streamlabs.com';
  }

  get overlays() {
    if (Util.isPreview()) {
      return 'beta-overlays.streamlabs.com';
    }
    return 'overlays.streamlabs.com';
  }

  get media() {
    return 'media.streamlabs.com';
  }

  get beta2() {
    return 'beta2.streamlabs.com';
  }

  get beta3() {
    return 'beta3.streamlabs.com';
  }

  get facemaskCDN() {
    return 'facemasks-cdn.streamlabs.com/';
  }

  get cdn() {
    return 'cdn.streamlabs.com';
  }

}
