import { Service } from './service';
import Util from 'services/utils';

// Hands out hostnames to the rest of the app. Eventually
// we should allow overriding this value. But for now we
// are just keeping the value in one place.
export class HostsService extends Service {

  useLocalhost = Util.useLocalhost();

  get streamlabs() {
    if (this.useLocalhost) {
      return 'http://streamlabs.site';
    }
    return 'https://streamlabs.com';
  }

  get overlays() {
    if (Util.isPreview()) {
      return 'https://beta-overlays.streamlabs.com';
    }
    return 'https://overlays.streamlabs.com';
  }

  get media() {
    return 'media.streamlabs.com';
  }

  get beta2() {
    return 'https://beta2.streamlabs.com';
  }

  get beta3() {
    return 'https://beta3.streamlabs.com';
  }

  get facemaskCDN() {
    return 'https://facemasks-cdn.streamlabs.com/';
  }

}
