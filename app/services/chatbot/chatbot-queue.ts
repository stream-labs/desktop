import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import io from 'socket.io-client';
import { ChatbotBaseApiService } from './chatbot-base';
import * as _ from 'lodash';

import {
  IChatbotAPIPostResponse,
  IQueuePreferencesResponse,
  IQueueStateResponse,
  IQueueEntriesResponse,
  IQueuePickedResponse,
  IQueuedUser,
  IQueueTotalResponse
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
    }
  };

  socket: SocketIOClient.Socket;
  //
  // sockets
  //
  connectToQueueSocketChannels() {
    if (this.socket) {
      if (this.socket.connected) {
        return;
      } else {
        this.socket.removeAllListeners();
      }
    }

    this.socket = io.connect(this.socketUrl, { transports: ['websocket'] });
    this.socket.emit('authenticate', {
      token: this.chatbotBaseApiService.state.socketToken
    });

    this.socket.on('queue.open', (response: IQueueStateResponse) => {
      this.UPDATE_QUEUE_STATE(response);
    });
    this.socket.on('queue.total', (response: IQueueTotalResponse) => {
      console.log(response);
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
      this.LEAVE_QUEUE_ENTRY(response);
    });
    this.socket.on('queue.deleted', (response: IQueuedUser) => {
      this.REMOVE_QUEUE_USER(response);
    });
    this.socket.on('queue.entries.clear', () => {
      this.CLEAR_QUEUE_ENTIES();
    });
    this.socket.on('queue.picked.clear', () => {
      this.CLEAR_QUEUE_PICKED();
      
    });
  }

  isConnected(){
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

  fetchQueueEntries(
    page = this.state.queueEntriesResponse.pagination.current,
    query = ''
  ) {
    return this.chatbotBaseApiService
      .api('GET', `queue/entries?page=${page}&query=${query}`, {})
      .then((response: IQueueEntriesResponse) => {
        this.UPDATE_QUEUE_ENTRIES(response);
      });
  }

  fetchQueuePicked(page = this.state.queuePickedResponse.pagination.current) {
    return this.chatbotBaseApiService
      .api('GET', `queue/picked?page=${page}`, {})
      .then((response: IQueuePickedResponse) => {
        this.UPDATE_QUEUE_PICKED(response);
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
  private ADD_QUEUE_ENTRY(response: IQueuedUser){
      this.state.queueEntriesResponse.data.push(response);

    //this.state.queueEntriesResponse.pagination.total = Math.ceil(response.id / 1);
  }

  @mutation()
  private PICK_QUEUE_ENTRY(response: IQueuedUser){
    _.remove(this.state.queueEntriesResponse.data,user =>{
      return user.platform === response.platform && user.viewer_id === response.viewer_id;
    });

    this.state.queuePickedResponse.data.push(response);

    const last = _.last(this.state.queueEntriesResponse.data)
    if(last){
      this.state.queueEntriesResponse.pagination.total = Math.ceil(last.id / 1);
    }
  }

  @mutation()
  private LEAVE_QUEUE_ENTRY(response:IQueuedUser){
    _.remove(this.state.queueEntriesResponse.data,user =>{
      return user.platform === response.platform && user.viewer_id === response.viewer_id;
    });

    Vue.set(this.state, 'queueEntriesResponse', this.state.queueEntriesResponse);

    const last = _.last(this.state.queueEntriesResponse.data)
    if(last){
      this.state.queueEntriesResponse.pagination.total = Math.ceil(last.id / 1);
    }
  }

  @mutation()
  private REMOVE_QUEUE_USER(response:IQueuedUser){
    //  Attempt to remove from entry list
    const removedEntry = _.remove(this.state.queueEntriesResponse.data,user =>{
      return user.id === response.id && user.platform === response.platform && user.viewer_id === response.viewer_id;
    });

    Vue.set(this.state, 'queueEntriesResponse', this.state.queueEntriesResponse);
    
    if(removedEntry.length != 0){
      const last = _.last(this.state.queueEntriesResponse.data)
      if(last){
        this.state.queueEntriesResponse.pagination.total = Math.ceil(last.id / 1);
      }
    }

    //  Attempt to remove from picked list
    const removedPicked = _.remove(this.state.queuePickedResponse.data,user =>{
      return user.id === response.id && user.platform === response.platform && user.viewer_id === response.viewer_id;
    });

    Vue.set(this.state, 'queuePickedResponse', this.state.queuePickedResponse);

    if(removedPicked.length != 0){
      const last = _.last(this.state.queuePickedResponse.data)
      if(last){
        this.state.queuePickedResponse.pagination.total = Math.ceil(last.id / 1);
      }
    }

  }

  @mutation()
  private CLEAR_QUEUE_ENTIES(){
    this.state.queueEntriesResponse.data = [];
    this.state.queueEntriesResponse.pagination.total = 1;
    this.state.queueEntriesResponse.pagination.current = 1;
  }

  @mutation()
  private CLEAR_QUEUE_PICKED(){
    this.state.queuePickedResponse.data = [];
    this.state.queuePickedResponse.pagination.total = 1;
    this.state.queuePickedResponse.pagination.current = 1;
  }
}
