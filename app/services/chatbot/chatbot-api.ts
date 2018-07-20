import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../stateful-service';

import {
  ChatbotApiServiceState,
  DefaultCommandRow
} from './chatbot-interfaces';


export class ChatbotApiService extends PersistentStatefulService<ChatbotApiServiceState> {
  @Inject() userService: UserService;

  cdn = 'https://chatbot-api.streamlabs.com/';
  version = 'api/v1/';

  apiEndpoint(route: String, versionIncluded?: Boolean) {
    return `${this.cdn}${versionIncluded ? this.version : ''}${route}`;
  }

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
        .then((response: ChatbotApiServiceState) => {
          this.LOGIN(response);
          resolve(true);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  //
  // GET requests
  //

  fetchDefaultCommands() {
    const url = this.apiEndpoint('commands/default', true);
    const headers = authorizedHeaders(this.state.api_token);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  //
  // POST requests
  //
  updateDefaultCommand(slugName: string, commandName: string, data: any) {
    const url = this.apiEndpoint(`settings/${slugName}/commands/${commandName}`, true);
    const headers = authorizedHeaders(this.state.api_token);
    headers.append('Content-Type', 'application/json');
    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(data)
    });

    debugger;

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  //
  // Mutations
  //
  @mutation()
  LOGIN(response: ChatbotApiServiceState) {
    Vue.set(this.state, 'api_token', response.api_token);
    Vue.set(this.state, 'socket_token', response.socket_token);
  }
}
