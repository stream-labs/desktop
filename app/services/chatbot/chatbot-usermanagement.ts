import Vue from 'vue';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { mutation } from '../core/stateful-service';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IUserManagementResponse,
  IManagedUser,
  IChatbotAPIPostResponse,
  IChatbotAPIPutResponse,
} from './chatbot-interfaces';
import { ChatbotCommonService } from './chatbot-common';

// state
interface IChatbotUserManagementApiServiceState {
  regularsResponse: IUserManagementResponse;
}

export class ChatbotUserManagementApiService extends PersistentStatefulService<
  IChatbotUserManagementApiServiceState
> {
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  @Inject() chatbotCommonService: ChatbotCommonService;

  static defaultState: IChatbotUserManagementApiServiceState = {
    regularsResponse: {
      data: [],
      pagination: {
        current: 1,
        total: 1,
      },
    },
  };

  fetchRegulars(page = this.state.regularsResponse.pagination.current, query = '') {
    return this.chatbotBaseApiService
      .api('GET', `user-management/regulars?page=${page}&query=${query}`, {})
      .then((response: IUserManagementResponse) => {
        this.UPDATE_REGULARS(response);
      });
  }

  // create
  createRegular(data: IManagedUser) {
    return this.chatbotBaseApiService
      .api('POST', 'user-management/regulars', data)
      .then((response: IManagedUser) => {
        this.fetchRegulars();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  // Update
  updateRegular(id: string, data: IManagedUser) {
    return this.chatbotBaseApiService
      .api('PUT', `user-management/regulars/${id}`, data)
      .then((response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchRegulars();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  //  Delete
  deleteRegular(id: string) {
    return this.chatbotBaseApiService
      .api('DELETE', `user-management/regulars/${id}`, {})
      .then((response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchRegulars();
        }
      });
  }
  @mutation()
  private UPDATE_REGULARS(response: IUserManagementResponse) {
    Vue.set(this.state, 'regularsResponse', response);
  }
}
