import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import uniqBy from 'lodash/uniqBy';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { mutation } from '../core/stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import io from 'socket.io-client';
import { ChatbotBaseApiService } from './chatbot-base';

import {
  IChatbotAPIPostResponse,
  IQueuePreferencesResponse,
  IQueueStateResponse,
  IQueueEntriesResponse,
  IQueuePickedResponse,
  IQueuedUser,
  IQueueLeaveData,
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
      settings: null,
    },
    queueStateResponse: {
      status: 'Closed',
    },
    queueEntriesResponse: {
      cursor: {
        after: 0,
        before: 0,
      },
      data: [],
    },
    queuePickedResponse: {
      cursor: {
        after: 0,
        before: 0,
      },
      data: [],
    },
  };

  socket: SocketIOClient.Socket;
  //
  // sockets
  //
  connectSocket() {
    if (this.socket) {
      if (this.socket.connected) {
        return;
      }
      this.socket.removeAllListeners();
    }

    this.authSocket();
    this.assignListeners();
  }

  authSocket() {
    this.socket = io.connect(
      this.socketUrl,
      { transports: ['websocket'] },
    );
    this.socket.emit('authenticate', {
      token: this.chatbotBaseApiService.state.socketToken,
    });
  }

  assignListeners() {
    this.socket.on('queue.open', (response: IQueueStateResponse) => {
      this.UPDATE_QUEUE_STATE(response);
    });
    this.socket.on('queue.close', (response: IQueueStateResponse) => {
      this.UPDATE_QUEUE_STATE(response);
    });
    this.socket.on('queue.join', (response: IQueuedUser) => {
      this.ADD_QUEUE_ENTRY(response);
    });
    this.socket.on('queue.pick', (response: IQueuedUser) => {
      this.PICK_QUEUE_ENTRY(response);
    });
    this.socket.on('queue.leave', (response: IQueuedUser) => {
      this.REMOVE_QUEUE_ENTRY(response);
    });
    this.socket.on('queue.deleted', (response: IQueuedUser) => {
      this.REMOVE_QUEUE_ENTRY(response);
    });
    this.socket.on('queue.entries.clear', () => {
      this.CLEAR_QUEUE_ENTIES();
    });
    this.socket.on('queue.picked.clear', () => {
      this.CLEAR_QUEUE_PICKED();
    });
  }

  disconnectSocket() {
    if (this.isConnected()) {
      this.socket.disconnect();
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  //
  // GET requests
  //
  fetchQueuePreferences() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/queue', {})
      .then((response: IQueuePreferencesResponse) => {
        this.UPDATE_QUEUE_PREFERENCES(response);
      });
  }

  fetchQueueState() {
    return this.chatbotBaseApiService
      .api('GET', 'queue', {})
      .then((response: IQueueStateResponse) => {
        this.UPDATE_QUEUE_STATE(response);
      });
  }

  fetchQueueEntries(after = this.state.queueEntriesResponse.cursor.after, query = '') {
    return this.chatbotBaseApiService
      .api('GET', `queue/entries?after=${after}&query=${query}`, {})
      .then((response: IQueueEntriesResponse) => {
        if (after === 0) {
          this.UPDATE_QUEUE_ENTRIES(response);
        } else {
          this.APPEND_QUEUE_ENTRIES(response);
        }
      });
  }

  fetchQueuePicked(after = this.state.queuePickedResponse.cursor.after) {
    return this.chatbotBaseApiService
      .api('GET', `queue/picked?after=${after}`, {})
      .then((response: IQueuePickedResponse) => {
        if (after === 0) {
          this.UPDATE_QUEUE_PICKED(response);
        } else {
          this.APPEND_QUEUE_PICKED(response);
        }
      });
  }

  //
  // Update
  //
  updateQueuePreferences(data: IQueuePreferencesResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/queue', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchQueuePreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
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

  @mutation()
  private APPEND_QUEUE_PICKED(response: IQueuePickedResponse) {
    if (response.data.length !== 0) {
      this.state.queueEntriesResponse.data = uniqBy(
        this.state.queueEntriesResponse.data.concat(response.data),
        x => x.id,
      );

      if (response.cursor.before < response.cursor.after) {
        this.state.queuePickedResponse.cursor = response.cursor;
      }
    }
  }

  @mutation()
  private APPEND_QUEUE_ENTRIES(response: IQueueEntriesResponse) {
    if (response.data.length !== 0) {
      this.state.queueEntriesResponse.data = uniqBy(
        this.state.queueEntriesResponse.data.concat(response.data),
        x => x.id,
      );

      if (response.cursor.before < response.cursor.after) {
        this.state.queueEntriesResponse.cursor = response.cursor;
      }
    }
  }

  @mutation()
  private ADD_QUEUE_ENTRY(response: IQueuedUser) {
    const data = this.state.queueEntriesResponse.data;
    const lastItem = data[data.length - 1];

    if (!lastItem || lastItem.custom_id + 1 === response.custom_id) {
      const clone = cloneDeep(this.state.queueEntriesResponse.data);
      clone.push(response);
      this.state.queueEntriesResponse.data = clone;
    }
  }

  @mutation()
  private PICK_QUEUE_ENTRY(response: IQueuedUser) {
    const index = this.state.queueEntriesResponse.data.findIndex(x => {
      return x.id === response.id;
    });

    if (index !== -1) {
      const tempData = cloneDeep(this.state.queueEntriesResponse.data);

      for (let i = index; i < this.state.queueEntriesResponse.data.length; ++i) {
        tempData[i].custom_id--;
      }

      tempData.splice(index, 1);

      this.state.queueEntriesResponse.data = tempData;
    }

    this.state.queuePickedResponse.data.push(response);
  }

  @mutation()
  private REMOVE_QUEUE_ENTRY(response: IQueueLeaveData) {
    //  Remove Entry
    const indexEntry = this.state.queueEntriesResponse.data.findIndex(x => x.id === response.id);

    if (indexEntry !== -1) {
      const tempData = cloneDeep(this.state.queueEntriesResponse.data);

      for (let i = indexEntry; i < this.state.queueEntriesResponse.data.length; ++i) {
        tempData[i].custom_id--;
      }

      tempData.splice(indexEntry, 1);

      this.state.queueEntriesResponse.data = tempData;
    }

    //  Remove Picked user
    const indexPicked = this.state.queuePickedResponse.data.findIndex(x => x.id === response.id);

    if (indexPicked !== -1) {
      this.state.queuePickedResponse.data.splice(indexPicked, 1);
    }
  }

  @mutation()
  private CLEAR_QUEUE_ENTIES() {
    this.state.queueEntriesResponse.data = [];
  }

  @mutation()
  private CLEAR_QUEUE_PICKED() {
    this.state.queuePickedResponse.data = [];
  }
}
