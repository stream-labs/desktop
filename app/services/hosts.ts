import { Service } from './service';

// Hands out hostnames to the rest of the app. Eventually
// will allow overriding based on environment
export class HostsService extends Service {

  get streamlabs() {
    return 'streamlabs.com';
  }

}
