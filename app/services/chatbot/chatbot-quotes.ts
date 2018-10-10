import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IChatbotAPIPostResponse,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  IQuotesResponse,
  IQuote,
  IQuotePreferencesResponse,
} from './chatbot-interfaces';

// state
interface IChatbotQuotesApiServiceState {
  quotesResponse: IQuotesResponse;
  quotePreferencesResponse: IQuotePreferencesResponse;
}

export class ChatbotQuotesApiService extends PersistentStatefulService<IChatbotQuotesApiServiceState> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotQuotesApiServiceState = {
    quotesResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    quotePreferencesResponse: {
      enabled: false,
      settings: null
    },
  };

  //
  // GET requests
  //
  fetchQuotes(page = this.state.quotesResponse.pagination.current, query = '') {
    return this.chatbotBaseApiService.api('GET', `quotes?page=${page}&query=${query}`, {}).then(
      (response: IQuotesResponse) => {
        this.UPDATE_QUOTES(response);
      }
    );
  }

  fetchQuotePreferences() {
    return this.chatbotBaseApiService.api('GET', 'settings/quotes', {}).then(
      (response: IQuotePreferencesResponse) => {
        this.UPDATE_QUOTE_PREFERENCES(response);
      }
    );
  }

  //
  // POST, PUT requests
  //
  createQuote(data: IQuote) {
    return this.chatbotBaseApiService.api('POST', 'quotes', data).then((response: IQuote) => {
      this.fetchQuotes();
      this.chatbotCommonService.closeChildWindow();
    });
  }
  updateQuote(id: number, data: IQuote) {
    return this.chatbotBaseApiService.api('PUT', `quotes/${id}`, data).then(
      (response: IChatbotAPIPutResponse) => {
        if (response.success === true) {
          this.fetchQuotes();
          this.chatbotCommonService.closeChildWindow();
        }
      }
    );
  }

  updateQuotePreferences(data: IQuotePreferencesResponse) {
    return this.chatbotBaseApiService.api('POST', 'settings/quotes', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchQuotePreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      }
    );
  }

  //
  // DELETE methods
  //
  deleteQuote(id: number) {
    return this.chatbotBaseApiService.api('DELETE', `quotes/${id}`, {}).then(
      (response: IChatbotAPIDeleteResponse) => {
        if (response.success === true) {
          this.fetchQuotes();
        }
      }
    );
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_QUOTES(response: IQuotesResponse) {
    Vue.set(this.state, 'quotesResponse', response);
  }

  @mutation()
  private UPDATE_QUOTE_PREFERENCES(response: IQuotePreferencesResponse) {
    Vue.set(this.state, 'quotePreferencesResponse', response);
  }
}
