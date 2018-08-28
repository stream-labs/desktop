
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation, StatefulService } from 'services/stateful-service';
import { UserService } from 'services/user';
import { HostsService } from './hosts';


export enum EAvailableFeatures {
  chatbot = 'slobs--chatbot'
}

interface IIncrementalRolloutServiceState {
  availableFeatures: string[];
}

export class IncrementalRolloutService extends StatefulService<IIncrementalRolloutServiceState> {
  @Inject() private userService: UserService;
  @Inject() private hostsService: HostsService;

  static defaultState: IIncrementalRolloutServiceState = {
    availableFeatures: []
  }

  @mutation()
  private SET_AVAILABLE_FEATURES(features: string[]) {
    this.state.availableFeatures = features;
  }

  get availableFeatures() {
    return this.state.availableFeatures;
  }


  fetchAvailableFeatures() {
    if (this.userService.isLoggedIn()) {
      const host = this.hostsService.streamlabs;
      const url = `https://${host}/api/v5/slobs/available-features`;
      const headers = authorizedHeaders(this.userService.apiToken);
      const request = new Request(url, { headers });

      return fetch(request)
        .then(handleErrors)
        .then(response => response.json())
        .then(response => {
          this.SET_AVAILABLE_FEATURES(response);
        });
    }
  }

}
