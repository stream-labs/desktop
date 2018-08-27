import { Service } from 'services/service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { HostsService } from './hosts';

// this service is used to manage visibility of experimental features

// it speaks to sl.com
export class FeatureAvailabilityService extends Service {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;

  mounted() {
    // this.fetchAvaiableFeatures();
  }

}
