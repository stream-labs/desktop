import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../stateful-service';

import {
  IChatbotAuthResponse,
  IChatbotErrorResponse,
  IChatbotStatusResponse,
  ChatbotClients,
  IChatbotAPIPostResponse,
  ChatbotSettingSlug,
  IChatbotSocketAuthResponse,
  ChatbotSocketRoom,
} from './chatbot-interfaces';

// state
interface IChatbotBaseApiServiceState {
  apiToken: string;
  socketToken: string;
  globallyEnabled: boolean;
}

export class ChatbotBaseApiService extends PersistentStatefulService<IChatbotBaseApiServiceState> {
  @Inject() userService: UserService;

  apiUrl = 'https://chatbot-api.streamlabs.com/';
  socketUrl = 'https://chatbot-io.streamlabs.com';
  version = 'api/v1/';

  static defaultState: IChatbotBaseApiServiceState = {
    apiToken: null,
    socketToken: null,
    globallyEnabled: false,
  };

  //
  // service methods
  //

  logIn() {
    return new Promise((resolve, reject) => {
      const url = this.apiEndpoint('login');
      const headers = authorizedHeaders(this.userService.apiToken);
      headers.append('Content-Type', 'application/json');
      const request = new Request(url, {
        headers,
        method: 'POST',
        body: JSON.stringify({})
      });

      fetch(request)
        .then(handleErrors)
        .then(response => response.json())
        .then((response: IChatbotAuthResponse) => {
          this.LOGIN(response);
          resolve(true);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  logOut() {
    this.LOGOUT();
  }

  apiEndpoint(route: String, versionIncluded?: Boolean) {
    return `${this.apiUrl}${versionIncluded ? this.version : ''}${route}`;
  }

  api(method: string, endpoint: string, data: any) {
    debugger;
    const url = this.apiEndpoint(endpoint, true);
    const headers = authorizedHeaders(this.state.apiToken);
    let options: {
      headers: any;
      method: string;
      body?: string;
    } = {
      headers,
      method
    };
    if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
      options.headers.append('Content-Type', 'application/json');
      options.body = JSON.stringify(data || {});
    }
    const request = new Request(url, options);

    return fetch(request)
      .then(handleErrors)
      .then(response => {
        return response.json();
      })
      .catch(error => {
        // errors contain string response. Need to json()
        // and return the promised error
        return error
          .json()
          .then((errJson: Promise<IChatbotErrorResponse>) =>
            Promise.reject(errJson)
          );
      });
  }

  //
  // sockets
  //
  logInToSocket(rooms: ChatbotSocketRoom[]) {
    // requires log in
    return this.api('GET', `socket-token?rooms=${rooms.join(',')}`, {}).then(
      (response: IChatbotSocketAuthResponse) => {
        this.LOGIN_TO_SOCKET(response);
      }
    );
  }

  //
  // GET requests
  //

  fetchChatbotGlobalEnabled() {
    return this.api('GET', 'status', {}).then(
      (response: IChatbotStatusResponse) => {
        // check for clients

        const clientFound = response.clients.services.some(value => {
          return value.toLowerCase() == this.userService.platform.type;
        });

        // all status online.
        this.UPDATE_GLOBALLY_ENABLED(
          response.worker.status === 'Online' &&
          response.worker.type === 'Full' &&
          response.clients.status === 'Online' &&
          clientFound
        );
      }
    );
  }

  //
  // POST, PUT requests
  //
  resetSettings(slug: ChatbotSettingSlug) {
    return this.api('POST', `settings/${slug}/reset`, {});
  }

  toggleEnableChatbot() {
    const platforms = ChatbotClients.map(client => client.toLowerCase());

    let containsPlatform = platforms.some(value => {
      return value.toLowerCase() == this.userService.platform.type;
    });

    if (containsPlatform) {
      return Promise.all([
        this.state.globallyEnabled
          ? this.leavePlatformChannel(this.userService.platform.type)
          : this.joinPlatformChannel(this.userService.platform.type)
      ]).then((response: IChatbotAPIPostResponse[]) => {
        this.fetchChatbotGlobalEnabled();
      });
    }
  }

  joinPlatformChannel(platform: string) {
    return this.api('POST', `bot/${platform}/join`, {});
  }

  leavePlatformChannel(platform: string) {
    return this.api('POST', `bot/${platform}/part`, {});
  }

  //
  // Mutations
  //
  @mutation()
  private LOGIN(response: IChatbotAuthResponse) {
    Vue.set(this.state, 'apiToken', response.api_token);
  }

  @mutation()
  private LOGIN_TO_SOCKET(response: IChatbotSocketAuthResponse) {
    Vue.set(this.state, 'socketToken', response.socket_token);
  }

  @mutation()
  private LOGOUT() {
    Vue.set(this.state, 'apiToken', null);
    Vue.set(this.state, 'socketToken', null);
  }

  @mutation()
  private UPDATE_GLOBALLY_ENABLED(enabled: boolean) {
    Vue.set(this.state, 'globallyEnabled', enabled);
  }

}
