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
  Timer,
  DafaultCommandsResponse,
  CustomCommandsResponse,
  TimersResponse,
  ChatbotAPIPostResponse,
  ChatbotAPIPutResponse
} from './chatbot-interfaces';

export class ChatbotApiService extends PersistentStatefulService<ChatbotApiServiceState> {
  @Inject() userService: UserService;
  @Inject() chatbotCommonService: ChatbotCommonService;

  apiUrl = 'https://chatbot-api.streamlabs.com/';
  version = 'api/v1/';

  static defaultState: ChatbotApiServiceState = {
    api_token: null,
    socket_token: null,
    default_commands_response: {
      commands: {},
      'link-protection': {},
      giveaway: {}
    },
    custom_commands_response: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    timers_response: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
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
        .then((response: ChatbotApiServiceState) => {
          this.LOGIN(response);
          resolve(true);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  apiEndpoint(route: String, versionIncluded?: Boolean) {
    return `${this.apiUrl}${versionIncluded ? this.version : ''}${route}`;
  }


  api(method: string, endpoint: string, data: any) {
    const url = this.apiEndpoint(endpoint, true);
    const headers = authorizedHeaders(this.state.api_token);
    let options: {
      headers: any,
      method: string,
      body?: string
    } = {
      headers,
      method,
    };
    if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
      options.headers.append('Content-Type', 'application/json');
      options.body = JSON.stringify(data || {});
    }
    const request = new Request(url, options);

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  //
  // GET requests
  //

  fetchDefaultCommands() {
    return this.api('GET', 'commands/default', {})
      .then((response: DafaultCommandsResponse) => {
        this.UPDATE_DEFAULT_COMMANDS(response);
      });
  }

  fetchCustomCommands(page?: number) {
    return this.api('GET', `commands?page=${page || 1}`, {})
      .then((response: CustomCommandsResponse) => {
        this.UPDATE_CUSTOM_COMMANDS(response);
      });
  }

  fetchTimers(page?: number) {
    return this.api('GET', `timers?page=${page || 1}`, {})
      .then((response: TimersResponse) => {
        this.UPDATE_TIMERS(response);
      });
  }

  //
  // POST, PUT requests
  //
  createCustomCommand(data: CustomCommand) {
    return this.api('POST', 'commands', data)
      .then((response: CustomCommand) => {
        this.fetchCustomCommands();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  createTimer(data: Timer) {
    return this.api('POST', 'timers', data)
      .then((response: Timer) => {
        this.fetchTimers();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  updateDefaultCommand(slugName: string, commandName: string, data: DefaultCommand) {
    return this.api('POST', `settings/${slugName}/commands/${commandName}`, data)
      .then((response: ChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchDefaultCommands();
        }
      });
  }

  updateCustomCommand(id: string, data: CustomCommand) {
    return this.api('PUT', `commands/${id}`, data)
      .then((response: ChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchCustomCommands();
        }
      });
  }

  updateTimer(id: string, data: Timer) {
    return this.api('PUT', `timers/${id}`, data)
      .then((response: ChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchTimers();
        }
      });
  }

  //
  // Mutations
  //
  @mutation()
  private LOGIN(response: ChatbotApiServiceState) {
    Vue.set(this.state, 'api_token', response.api_token);
    Vue.set(this.state, 'socket_token', response.socket_token);
  }

  @mutation()
  private UPDATE_DEFAULT_COMMANDS(response: DafaultCommandsResponse) {
    Vue.set(this.state, 'default_commands_response', response);
  }

  @mutation()
  private UPDATE_CUSTOM_COMMANDS(response: CustomCommandsResponse) {
    Vue.set(this.state, 'custom_commands_response', response);
  }

  @mutation()
  private UPDATE_TIMERS(response: TimersResponse) {
    Vue.set(this.state, 'timers_response', response);
  }
}

export class ChatbotCommonService extends PersistentStatefulService<
  ChatbotApiServiceState
  > {
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
    });
  }
}
