import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import io from 'socket.io-client';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IChatbotAPIPostResponse,
  IQuotePreferencesResponse,
  IQueuePreferencesResponse,
  IQueueStateResponse,
  IQueueEntriesResponse,
  IQueuePickedResponse,
} from './chatbot-interfaces';

// state
interface IChatbotQueueApiServiceState {
  queuePreferencesResponse: IQueuePreferencesResponse;
  queueStateResponse: IQueueStateResponse;
  queueEntriesResponse: IQueueEntriesResponse;
  queuePickedResponse: IQueuePickedResponse;
}

export class ChatbotQueueApiService extends PersistentStatefulService<
  IChatbotQueueApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  socketUrl = this.chatbotBaseApiService.socketUrl;

  static defaultState: IChatbotQueueApiServiceState = {
    queuePreferencesResponse: {
      enabled: false,
      settings: null
    },
    queueStateResponse: {
      status: 'Closed'
    },
    queueEntriesResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    queuePickedResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
  };

  //
  // sockets
  //
  connectToQueueSocketChannels() {
    let socket = io.connect(this.socketUrl, { transports: ['websocket'] });
    socket.emit('authenticate', { token: this.chatbotBaseApiService.state.socketToken });

    socket.on('queue.open', (response: IQueueStateResponse) => {
      // queue open
      this.UPDATE_QUEUE_STATE(response);
    });
    socket.on('queue.close', (response: IQueueStateResponse) => {
      // queue open
      this.UPDATE_QUEUE_STATE(response);
    });
    socket.on('queue.join', () => {
      // someone joins queue, refetch queue entries
      this.fetchQueueEntries();
    });
    socket.on('queue.pick', () => {
      // someone got selected, refetch queue entries and picked entries
      this.fetchQueueEntries();
      this.fetchQueuePicked();
    });
    socket.on('queue.leave', () => {
      // someone leaves queue, refetch queue entries
      this.fetchQueueEntries();
    });
    socket.on('queue.deleted', () => {
      // queue deleted, refresh both entries
      this.fetchQueueEntries();
      this.fetchQueuePicked();
    });
    socket.on('queue.entries.clear', () => {
      // Clear entries
      this.fetchQueueEntries();
    });
    socket.on('queue.picked.clear', () => {
      // Clear entries
      this.fetchQueuePicked();
    });
  }

  //
  // GET requests
  //
  fetchQuotePreferences() {
    return this.chatbotBaseApiService.api('GET', 'settings/quotes', {}).then(
      (response: IQuotePreferencesResponse) => {
        this.UPDATE_QUOTE_PREFERENCES(response);
      }
    );
  }

  fetchQueuePreferences() {
    return this.chatbotBaseApiService.api('GET', 'settings/queue', {}).then(
      (response: IQueuePreferencesResponse) => {
        this.UPDATE_QUEUE_PREFERENCES(response);
      }
    );
  }

  fetchQueueState() {
    return this.chatbotBaseApiService.api('GET', 'queue', {}).then(
      (response: IQueueStateResponse) => {
        this.UPDATE_QUEUE_STATE(response);
      }
    );
  }

  fetchQueueEntries(
    page = this.state.queueEntriesResponse.pagination.current,
    query = ''
  ) {
    return this.chatbotBaseApiService.api(
      'GET',
      `queue/entries?page=${page}&query=${query}`,
      {}
    ).then((response: IQueueEntriesResponse) => {
      this.UPDATE_QUEUE_ENTRIES(response);
    });
  }

  fetchQueuePicked(page = this.state.queuePickedResponse.pagination.current) {
    return this.chatbotBaseApiService.api('GET', `queue/picked?page=${page}`, {}).then(
      (response: IQueuePickedResponse) => {
        this.UPDATE_QUEUE_PICKED(response);
      }
    );
  }

  //
  // Update
  //
  updateQueuePreferences(data: IQueuePreferencesResponse) {
    return this.chatbotBaseApiService.api('POST', 'settings/queue', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchQueuePreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      }
    );
  }

  openQueue(title: string) {
    return this.chatbotBaseApiService.api('PUT', 'queue/open', { title });
  }

  closeQueue() {
    return this.chatbotBaseApiService.api('PUT', 'queue/close', {});
  }

  pickQueueEntry(id: number) {
    return this.chatbotBaseApiService.api('PUT', `queue/pick/${id}`, {});
  }

  pickQueueEntryRandom() {
    return this.chatbotBaseApiService.api('PUT', 'queue/pick/random', {});
  }

  //
  // DELETE methods
  //
  clearQueueEntries() {
    return this.chatbotBaseApiService.api('DELETE', 'queue/entries', {});
  }

  clearQueuePicked() {
    return this.chatbotBaseApiService.api('DELETE', 'queue/picked', {});
  }

  removeQueueEntry(id: number) {
    return this.chatbotBaseApiService.api('DELETE', `queue/${id}`, {});
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_QUOTE_PREFERENCES(response: IQuotePreferencesResponse) {
    Vue.set(this.state, 'quotePreferencesResponse', response);
  }

  @mutation()
  private UPDATE_QUEUE_PREFERENCES(response: IQueuePreferencesResponse) {
    Vue.set(this.state, 'queuePreferencesResponse', response);
  }

  @mutation()
  private UPDATE_QUEUE_STATE(response: IQueueStateResponse) {
    Vue.set(this.state, 'queueStateResponse', response);
  }

  @mutation()
  private UPDATE_QUEUE_ENTRIES(response: IQueueEntriesResponse) {
    Vue.set(this.state, 'queueEntriesResponse', response);
  }

  @mutation()
  private UPDATE_QUEUE_PICKED(response: IQueuePickedResponse) {
    Vue.set(this.state, 'queuePickedResponse', response);
  }
}
