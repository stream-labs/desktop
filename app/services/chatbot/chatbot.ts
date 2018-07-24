import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../stateful-service';
import { WindowsService } from 'services/windows';

import {
  ChatbotApiServiceState,
  CustomCommand,
  DefaultCommand,
  Timer
} from './chatbot-interfaces';

export class ChatbotApiService extends PersistentStatefulService<ChatbotApiServiceState> {
  @Inject() userService: UserService;

  apiUrl = 'https://chatbot-api.streamlabs.com/';
  version = 'api/v1/';

  apiEndpoint(route: String, versionIncluded?: Boolean) {
    return `${this.apiUrl}${versionIncluded ? this.version : ''}${route}`;
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

  api(method: string, endpoint: string, data: any) {
    const url = this.apiEndpoint(endpoint, true);
    const headers = authorizedHeaders(this.state.api_token);
    if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
      headers.append('Content-Type', 'application/json');
    }
    const request = new Request(url, {
      headers,
      method,
      body: JSON.stringify(data || {})
    });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  //
  // GET requests
  //

  fetchDefaultCommands() {
    return this.api('GET','commands/default', {});
  }

  fetchCustomCommands(page: number) {
    return this.api('GET', `commands?page=${page}`, {});
  }

  fetchTimers(page: number) {
    return this.api('GET', `timers?page=${page}`, {});
  }

  //
  // POST, PUT requests
  //
  updateDefaultCommand(slugName: string, commandName: string, data: DefaultCommand) {
    return this.api('POST', `settings/${slugName}/commands/${commandName}`, data);
  }

  updateCustomCommand(id: string, data: CustomCommand) {
    return this.api('PUT', `commands/${id}`, data);
  }

  createCustomCommand(data: CustomCommand) {
    return this.api('POST', 'commands', data);
  }

  createTimer(data: Timer) {
    return this.api('POST', 'timers', data);
  }

  updateTimer(id: string, data: Timer) {
    return this.api('PUT', `timers/${id}`, data);
  }

  //
  // Mutations
  //
  @mutation()
  private LOGIN(response: ChatbotApiServiceState) {
    Vue.set(this.state, 'api_token', response.api_token);
    Vue.set(this.state, 'socket_token', response.socket_token);
  }
}


export class ChatbotCommonService extends PersistentStatefulService<ChatbotApiServiceState> {
  @Inject() windowsService: WindowsService;

  closeChildWindow() {
    this.windowsService.closeChildWindow();
  }

  openCommandWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotCommandWindow',
      size: {
        width: 650,
        height: 600
      }
    });
  }

  openTimerWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotTimerWindow',
      size: {
        width: 650,
        height: 400
      }
    })
  }
}
