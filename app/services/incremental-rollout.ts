import { Inject } from 'services/core/injector';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { mutation, StatefulService } from 'services/core/stateful-service';
import { UserService } from 'services/user';
import { HostsService } from './hosts';
import Utils from 'services/utils';

export enum EAvailableFeatures {
  chatbot = 'slobs--chatbot',
  platform = 'slobs--platform',
  creatorSites = 'slobs--creator-sites',
}

interface IIncrementalRolloutServiceState {
  availableFeatures: string[];
}

export class IncrementalRolloutService extends StatefulService<IIncrementalRolloutServiceState> {
  @Inject() private userService: UserService;
  @Inject() private hostsService: HostsService;

  static initialState: IIncrementalRolloutServiceState = {
    availableFeatures: [],
  };

  init() {
    this.userService.userLogin.subscribe(() => this.fetchAvailableFeatures());
    this.userService.userLogout.subscribe(() => this.resetAvailableFeatures());
  }

  @mutation()
  private SET_AVAILABLE_FEATURES(features: string[]) {
    this.state.availableFeatures = features;
  }

  get availableFeatures() {
    return this.state.availableFeatures || [];
  }

  featureIsEnabled(feature: EAvailableFeatures): boolean {
    if (Utils.isDevMode()) return true; // always show for dev mode

    return this.availableFeatures.indexOf(feature) > -1;
  }

  fetchAvailableFeatures() {
    if (this.userService.isLoggedIn()) {
      const host = this.hostsService.streamlabs;
      const url = `https://${host}/api/v5/slobs/available-features`;
      const headers = authorizedHeaders(this.userService.apiToken);
      const request = new Request(url, { headers });

      return fetch(request)
        .then(handleResponse)
        .then(response => {
          this.SET_AVAILABLE_FEATURES(response.features);
        });
    }
  }

  resetAvailableFeatures() {
    this.SET_AVAILABLE_FEATURES([]);
  }
}
