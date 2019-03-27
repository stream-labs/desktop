import Vue from 'vue';
import startCase from 'lodash/startCase';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IChatbotAPIPutResponse,
  ILoyaltyResponse,
  IChatbotLoyalty,
  ILoyaltyPreferencesData,
  ILoyaltyPreferencesResponse,
  IChatbotAPIPostResponse,
} from './chatbot-interfaces';

// state
interface IChatbotLoyaltyApiServiceState {
  loyaltyResponse: ILoyaltyResponse;
  loyaltyPreferencesResponse: ILoyaltyPreferencesResponse;
}

export class ChatbotLoyaltyApiService extends PersistentStatefulService<
  IChatbotLoyaltyApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotLoyaltyApiServiceState = {
    loyaltyResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
    loyaltyPreferencesResponse: {
      enabled: false,
      settings: {
        commands: {},
        general: {
          interval: {
            live: 5,
          },
          name: 'Points',
          payout: {
            active: 0,
            live: 1,
          },
        },
        advanced: {
          donations: {
            extralife: 0,
            streamlabs: 0,
            superchat: 0,
          },
          event: {
            on_follow: 0,
            on_host: 0,
            on_member: 0,
            on_raid: 0,
            on_sub: 0,
          },
        },
      },
    },
  };

  //
  // GET requests
  //
  fetchLoyalty(page = this.state.loyaltyResponse.pagination.current, query = '') {
    return this.chatbotBaseApiService
      .api('GET', `loyalty?page=${page}&query=${query}`, {})
      .then((response: ILoyaltyResponse) => {
        this.UPDATE_LOYALTY(response);
      });
  }

  fetchLoyaltyPreferences() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/loyalty', {})
      .then((response: ILoyaltyPreferencesData) => {
        this.UPDATE_LOYALTY_PREFERENCES(response);
      });
  }

  // Update
  updateLoyalty(id: number, data: IChatbotLoyalty) {
    return this.chatbotBaseApiService
      .api('PUT', `loyalty/${id}`, data)
      .then((response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchLoyalty();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  updateLoyaltyPreferences(data: ILoyaltyPreferencesResponse, closeChild: boolean = true) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/loyalty', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchLoyaltyPreferences();
          if (closeChild) {
            this.chatbotCommonService.closeChildWindow();
          }
        }
      });
  }

  addToAll(amount: number) {
    return this.chatbotBaseApiService
      .api('POST', 'loyalty/add-to-all', {
        amount,
        platform: startCase(this.chatbotBaseApiService.userService.platform.type),
      })
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchLoyalty();
        }
      });
  }

  //  DELETE
  clear() {
    return this.chatbotBaseApiService
      .api('DELETE', 'loyalty/reset-loyalty', {})
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchLoyalty();
        }
      });
  }
  delete(id: number) {
    return this.chatbotBaseApiService
      .api('DELETE', `loyalty/reset/${id}`, {})
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchLoyalty();
        }
      });
  }
  //
  // Mutations
  //
  @mutation()
  private UPDATE_LOYALTY(response: ILoyaltyResponse) {
    Vue.set(this.state, 'loyaltyResponse', response);
  }

  @mutation()
  private UPDATE_LOYALTY_PREFERENCES(response: ILoyaltyPreferencesData) {
    Vue.set(this.state, 'loyaltyPreferencesResponse', response);
  }
}
