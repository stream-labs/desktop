import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IChatbotAPIPostResponse,
  IChatAlertsResponse,
} from './chatbot-interfaces';

// state
interface IChatbotAlertsApiServiceState {
  chatAlertsResponse: IChatAlertsResponse;
}

export class ChatbotAlertsApiService extends PersistentStatefulService<IChatbotAlertsApiServiceState> {
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  api = this.chatbotBaseApiService.api;

  static defaultState: IChatbotAlertsApiServiceState = {
    chatAlertsResponse: {
      enabled: false,
      settings: null
    },
  };

  //
  // GET requests
  //
  fetchChatAlerts() {
    return this.api('GET', 'settings/chat-notifications', {}).then(
      (response: IChatAlertsResponse) => {
        this.UPDATE_CHAT_ALERTS(response);
      }
    );
  }

  // Update
  updateChatAlerts(data: IChatAlertsResponse) {
    return this.api('POST', 'settings/chat-notifications', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchChatAlerts();
        }
      }
    );
  }

  // reset
  resetSettings() {
    return this.chatbotBaseApiService.resetSettings('chat-notifications').then(
      (response: IChatAlertsResponse) => {
        this.UPDATE_CHAT_ALERTS(response);
      }
    )
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_CHAT_ALERTS(response: IChatAlertsResponse) {
    Vue.set(this.state, 'chatAlertsResponse', response);
  }

}
