import Vue from 'vue';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { mutation } from '../core/stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';

import { IChatbotAPIPostResponse, IGamblePreferencesResponse } from './chatbot-interfaces';

// state
interface IChatbotGambleApiServiceState {
  gamblePreferencesResponse: IGamblePreferencesResponse;
}

export class ChatbotGambleApiService extends PersistentStatefulService<
  IChatbotGambleApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotGambleApiServiceState = {
    gamblePreferencesResponse: {
      settings: {
        commands: {},
        general: {
          max: 10000,
          min: 10,
          range: {
            '1-25': 0,
            '26-50': 0,
            '51-75': 0,
            '76-98': 0,
            '99-100': 0,
          },
        },
      },
      enabled: false,
    },
  };

  //
  // GET requests
  //
  fetchGamblePreferences() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/gamble', {})
      .then((response: IGamblePreferencesResponse) => {
        this.UPDATE_GAMBLE_PREFERENCES(response);
      });
  }

  // Update
  updateGamblePreferences(data: IGamblePreferencesResponse, closeChild: boolean = true) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/gamble', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchGamblePreferences();
          if (closeChild) {
            this.chatbotCommonService.closeChildWindow();
          }
        }
      });
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_GAMBLE_PREFERENCES(response: IGamblePreferencesResponse) {
    Vue.set(this.state, 'gamblePreferencesResponse', response);
  }
}
