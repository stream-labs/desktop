import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';
import * as _ from 'lodash';
import io from 'socket.io-client';

import {
  IChatbotAPIPostResponse,
  IPollPreferencesResponse,
  IPollProfile,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  IActivePollResponse
} from './chatbot-interfaces';

// state
interface IChatbotPollApiServiceState {
  pollPreferencesResponse: IPollPreferencesResponse;
  activePollResponse: IActivePollResponse;
}

export class ChatbotPollApiService extends PersistentStatefulService<
  IChatbotPollApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  socketUrl = this.chatbotBaseApiService.socketUrl;

  static defaultState: IChatbotPollApiServiceState = {
    pollPreferencesResponse: {
      enabled: false,
      settings: null
    },
    activePollResponse: {
      settings: {
        id: null,
        options: null,
        timer: null,
        title: null
      },
      status: null,
      user_id: null
    }
  };

  socket: SocketIOClient.Socket;

  //
  // sockets
  //
  connectSocket() {
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

    this.socket.on('poll.open', () => {
      //console.log(response);
    });

    this.socket.on('poll.close', (response: any) => {
      console.log(response);
    });

    this.socket.on('poll.cancel', (response: any) => {
      console.log(response);
    });

    this.socket.on('poll.complete', (response: any) => {
      console.log(response);
    });

    console.log('xD');
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
  fetchPollPreferences() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/poll', {})
      .then((response: IPollPreferencesResponse) => {
        this.UPDATE_POLL_PREFERENCES(response);
      });
  }

  fetchActivePoll() {
    return this.chatbotBaseApiService
      .api('GET', 'poll/active', {})
      .then((response: IActivePollResponse) => {
        this.UPDATE_ACTIVE_POLL(response);
      });
  }

  //
  // Update
  //
  updatePollPreferences(data: IPollPreferencesResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/poll', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchPollPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  addPollProfile(data: IPollProfile) {
    return this.chatbotBaseApiService
      .api('POST', 'poll/profile', data)
      .then(() => {
        this.fetchPollPreferences();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  updatePollProfile(data: IPollProfile) {
    return this.chatbotBaseApiService
      .api('PUT', `poll/profile/${data.id}`, data)
      .then((response: IChatbotAPIPutResponse) => {
        if (response) {
          this.fetchPollPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  startPoll(data: IPollProfile) {
    return this.chatbotBaseApiService
      .api('POST', `poll/start/${data.id}`, {})
      .then(() => {
        this.fetchActivePoll();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  openPoll() {
    return this.chatbotBaseApiService.api('PUT', 'poll/active/open', {});
  }

  closePoll() {
    return this.chatbotBaseApiService.api('PUT', 'poll/active/close', {});
  }

  cancelPoll() {
    return this.chatbotBaseApiService.api('PUT', 'poll/active/cancel', {});
  }

  completePoll() {
    return this.chatbotBaseApiService.api('PUT', 'poll/active/complete', {});
  }

  //
  // Delete
  //
  deletePollProfile(data: IPollProfile) {
    return this.chatbotBaseApiService
      .api('DELETE', `poll/profile/${data.id}`, {})
      .then((response: IChatbotAPIDeleteResponse) => {
        if (response.success === true) {
          this.fetchPollPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_POLL_PREFERENCES(response: IPollPreferencesResponse) {
    Vue.set(this.state, 'pollPreferencesResponse', response);
  }

  @mutation()
  private UPDATE_ACTIVE_POLL(response: IActivePollResponse) {
    Vue.set(this.state, 'activePollResponse', response);
    console.log(response);
  }

  @mutation()
  private UPDATE_POLL_STATE(status: string){
    //this.acti
  }
}
