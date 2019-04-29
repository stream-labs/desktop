import Vue from 'vue';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { mutation } from '../core/stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IChatbotTimer,
  ITimersResponse,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
} from './chatbot-interfaces';

// state
interface IChatbotTimerApiServiceState {
  timersResponse: ITimersResponse;
}

export class ChatbotTimerApiService extends PersistentStatefulService<
  IChatbotTimerApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotTimerApiServiceState = {
    timersResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
  };

  //
  // GET requests
  //
  fetchTimers(page = this.state.timersResponse.pagination.current, query = '') {
    return this.chatbotBaseApiService
      .api('GET', `timers?page=${page}&query=${query}`, {})
      .then((response: ITimersResponse) => {
        this.UPDATE_TIMERS(response);
      });
  }

  // create
  createTimer(data: IChatbotTimer) {
    return this.chatbotBaseApiService
      .api('POST', 'timers', data)
      .then((response: IChatbotTimer) => {
        this.fetchTimers();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  // Update
  updateTimer(id: string, data: IChatbotTimer) {
    return this.chatbotBaseApiService
      .api('PUT', `timers/${id}`, data)
      .then((response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchTimers();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  //
  // DELETE methods
  //
  deleteTimer(id: string) {
    return this.chatbotBaseApiService
      .api('DELETE', `timers/${id}`, {})
      .then((response: IChatbotAPIDeleteResponse) => {
        if (response.success === true) {
          this.fetchTimers();
        }
      });
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_TIMERS(response: ITimersResponse) {
    Vue.set(this.state, 'timersResponse', response);
  }
}
