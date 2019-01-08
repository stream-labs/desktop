import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  ICustomCommand,
  IDefaultCommand,
  IDafaultCommandsResponse,
  ICustomCommandsResponse,
  IChatbotAPIPostResponse,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  ICommandVariablesResponse,
  ICommandPreferencesResponse,
} from './chatbot-interfaces';

// state
interface IChatbotCommandsApiServiceState {
  commandPreferencesResponse: ICommandPreferencesResponse;
  defaultCommandsResponse: IDafaultCommandsResponse;
  customCommandsResponse: ICustomCommandsResponse;
  commandVariablesResponse: ICommandVariablesResponse;
}

export class ChatbotCommandsApiService extends PersistentStatefulService<IChatbotCommandsApiServiceState> {
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  @Inject() chatbotCommonService: ChatbotCommonService;

  static defaultState: IChatbotCommandsApiServiceState = {
    commandPreferencesResponse: {
      enabled: true,
      settings: null
    },
    defaultCommandsResponse: {
      commands: {},
      'link-protection': {},
      giveaway: {}
    },
    customCommandsResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    commandVariablesResponse: [],
  };

  //
  // GET requests
  //

  fetchDefaultCommands() {
    return this.chatbotBaseApiService.api('GET', 'commands/default', {}).then(
      (response: IDafaultCommandsResponse) => {
        console.log(response);
        this.UPDATE_DEFAULT_COMMANDS(response);
      }
    );
  }

  fetchCustomCommands(
    page = this.state.customCommandsResponse.pagination.current,
    query = ''
  ) {
    return this.chatbotBaseApiService.api('GET', `commands?page=${page}&query=${query}`, {}).then(
      (response: ICustomCommandsResponse) => {
        this.UPDATE_CUSTOM_COMMANDS(response);
      }
    );
  }

  fetchCommandPreferences(){
    return this.chatbotBaseApiService.api('GET', 'settings/commands', {}).then(
      (response: ICommandPreferencesResponse) => {
        console.log(response);
        this.UPDATE_COMMAND_PREFERENCES(response);
      }
    );
  }

  fetchCommandVariables() {
    return this.chatbotBaseApiService.api('GET', 'commands/variables', {}).then(
      (response: ICommandVariablesResponse) => {
        this.UPDATE_COMMAND_VARIABLES(response);
      }
    );
  }

  //
  // POST, PUT requests
  //
  resetDefaultCommands() {
    return this.chatbotBaseApiService.api('POST', 'commands/default/reset', {}).then(
      (response: IDafaultCommandsResponse) => {
        this.UPDATE_DEFAULT_COMMANDS(response);
      }
    );
  }

  resetDefaultCommand(slugName: string, commandName: string) {
    return this.chatbotBaseApiService.api(
      'POST',
      `settings/${slugName}/commands/${commandName}/reset`,
      {}
    ).then((response: IDefaultCommand) => {
      return Promise.resolve(response);
    });
  }

  // create
  createCustomCommand(data: ICustomCommand) {
    return this.chatbotBaseApiService.api('POST', 'commands', data).then(
      (response: ICustomCommand) => {
        this.fetchCustomCommands();
        this.chatbotCommonService.closeChildWindow();
      }
    );
  }

  // Update
  updateDefaultCommand(
    slugName: string,
    commandName: string,
    data: IDefaultCommand
  ) {
    return this.chatbotBaseApiService.api(
      'POST',
      `settings/${slugName}/commands/${commandName}`,
      data
    ).then((response: IChatbotAPIPostResponse) => {
      if (response.success === true) {
        this.fetchDefaultCommands();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  updateCommandPreferences(data: ICommandPreferencesResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/commands', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchCommandPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  updateCustomCommand(id: string, data: ICustomCommand) {
    return this.chatbotBaseApiService.api('PUT', `commands/${id}`, data).then(
      (response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchCustomCommands();
          this.chatbotCommonService.closeChildWindow();
        }
      }
    );
  }

  //
  // DELETE methods
  //
  deleteCustomCommand(id: string) {
    return this.chatbotBaseApiService.api('DELETE', `commands/${id}`, {}).then(
      (response: IChatbotAPIDeleteResponse) => {
        if (response.success === true) {
          this.fetchCustomCommands();
        }
      }
    );
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_DEFAULT_COMMANDS(response: IDafaultCommandsResponse) {
    Vue.set(this.state, 'defaultCommandsResponse', response);
  }

  @mutation()
  private UPDATE_CUSTOM_COMMANDS(response: ICustomCommandsResponse) {
    Vue.set(this.state, 'customCommandsResponse', response);
  }

  @mutation()
  private UPDATE_COMMAND_VARIABLES(response: ICommandVariablesResponse) {
    Vue.set(this.state, 'commandVariablesResponse', response);
  }

  @mutation()
  private UPDATE_COMMAND_PREFERENCES(response: ICommandPreferencesResponse) {
    Vue.set(this.state, 'commandPreferencesResponse', response);
  }
}
