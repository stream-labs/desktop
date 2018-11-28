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
  IQueuedUser
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
      // queue open
      this.UPDATE_QUEUE_STATE(response);
    });
    this.socket.on('queue.close', (response: IQueueStateResponse) => {
      // queue open
      this.UPDATE_QUEUE_STATE(response);
    });
    this.socket.on('queue.join', (response: IQueuedUser) => {
      // someone joins queue, refetch queue entries
      this.ADD_QUEUE_ENTRY(response);

      //this.fetchQueueEntries();
    });
    this.socket.on('queue.pick', (response: IQueuedUser) => {
      // someone got selected, refetch queue entries and picked entries
      this.PICK_QUEUE_ENTRY(response);
     
      //this.fetchQueueEntries();
      //this.fetchQueuePicked();
    });
    this.socket.on('queue.leave', (response: IQueuedUser) => {
      this.LEAVE_QUEUE_ENTRY(response);
      // someone leaves queue, refetch queue entries
      //this.fetchQueueEntries();
    });
    this.socket.on('queue.deleted', (response: IQueuedUser) => {
      // queue deleted, refresh both entries
      this.REMOVE_QUEUE_USER(response);
      //this.fetchQueueEntries();
      //this.fetchQueuePicked();
    });
    this.socket.on('queue.entries.clear', () => {
      // Clear entries
      //this.fetchQueueEntries();
      this.CLEAR_QUEUE_ENTIES();
    });
    this.socket.on('queue.picked.clear', () => {
      // Clear entries
      //this.fetchQueuePicked();
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
    let entries = _.cloneDeep(this.state.queueEntriesResponse);
    entries.data.push(response);
    Vue.set(this.state, 'queueEntriesResponse', entries);
  }

  @mutation()
  private PICK_QUEUE_ENTRY(response: IQueuedUser){
    let entries = _.cloneDeep(this.state.queueEntriesResponse);
    _.remove(entries.data,user =>{
      return user.platform === response.platform && user.viewer_id === response.viewer_id;
    });
    Vue.set(this.state, 'queueEntriesResponse', entries);

    let picked = _.cloneDeep(this.state.queuePickedResponse);
    picked.data.push(response);
    Vue.set(this.state, 'queuePickedResponse', picked);
  }

  @mutation()
  private LEAVE_QUEUE_ENTRY(response:IQueuedUser){
    let entries = _.cloneDeep(this.state.queueEntriesResponse);
    _.remove(entries.data,user =>{
      return user.platform === response.platform && user.viewer_id === response.viewer_id;
    });
    Vue.set(this.state, 'queueEntriesResponse', entries);
  }

  @mutation()
  private REMOVE_QUEUE_USER(response:IQueuedUser){
    let entries = _.cloneDeep(this.state.queueEntriesResponse);
    _.remove(entries.data,user =>{
      return user.id === response.id && user.platform === response.platform && user.viewer_id === response.viewer_id;
    });
    Vue.set(this.state, 'queueEntriesResponse', entries);

    let picked = _.cloneDeep(this.state.queuePickedResponse);
    _.remove(picked.data,user =>{
      return user.id === response.id && user.platform === response.platform && user.viewer_id === response.viewer_id;
    });
    Vue.set(this.state, 'queuePickedResponse', picked);
  }

  @mutation()
  private CLEAR_QUEUE_ENTIES(){
    let entries = _.cloneDeep(this.state.queueEntriesResponse);
    entries.data=[];
    Vue.set(this.state, 'queueEntriesResponse', entries);
  }

  @mutation()
  private CLEAR_QUEUE_PICKED(){
    let picked = _.cloneDeep(this.state.queuePickedResponse);
    picked.data = [];
    Vue.set(this.state, 'queuePickedResponse', picked);
  }
}
