import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';

import { IChatbotAPIPostResponse, IHeistPreferencesResponse } from './chatbot-interfaces';

// state
interface IChatbotHeistApiServiceState {
  heistPreferencesResponse: IHeistPreferencesResponse;
}

export class ChatbotHeistApiService extends PersistentStatefulService<
  IChatbotHeistApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotHeistApiServiceState = {
    heistPreferencesResponse: {
      enabled: false,
      settings: {
        commands: {},
        general: {
          max_amount: 1337,
          min_entries: 1,
          payout: {
            viewers: 50,
            moderators: 50,
            subscribers: 50,
          },
          probability: {
            moderators: 50,
            subscribers: 50,
            viewers: 50,
          },
          start_delay: 120,
          cooldown: 300,
        },
        messages: {
          group: {
            loss: '',
            partial: '',
            win: '',
          },
          results: '',
          solo: {
            loss: '',
            win: '',
          },
          start: {
            fail: '',
            first: '',
            success: '',
          },
        },
      },
    },
  };

  //
  // GET requests
  //
  fetchHeistPreferences() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/heist', {})
      .then((response: IHeistPreferencesResponse) => {
        this.UPDATE_HEIST_PREFERENCES(response);
      });
  }

  // Update
  updateHeistPreferences(data: IHeistPreferencesResponse, closeChild: boolean = true) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/heist', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchHeistPreferences();
          if (closeChild) {
            this.chatbotCommonService.closeChildWindow();
          }
        }
      });
  }

  resetSettings() {
    return this.chatbotBaseApiService
      .resetSettings('heist')
      .then((response: IHeistPreferencesResponse) => {
        this.UPDATE_HEIST_PREFERENCES(response);
        return Promise.resolve(response);
      });
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_HEIST_PREFERENCES(response: IHeistPreferencesResponse) {
    Vue.set(this.state, 'heistPreferencesResponse', response);
  }
}
