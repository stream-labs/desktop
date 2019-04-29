import Vue from 'vue';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { mutation } from '../core/stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';
import * as moment from 'moment';
import io from 'socket.io-client';

import {
  IChatbotAPIPostResponse,
  IPollPreferencesResponse,
  IPollProfile,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  IActivePollResponse,
  IPollOption,
  IPollTimer,
} from './chatbot-interfaces';

// state
interface IChatbotPollApiServiceState {
  pollPreferencesResponse: IPollPreferencesResponse;
  activePollResponse: IActivePollResponse;
  activeView: string;
  timeRemaining: string;
}

export class ChatbotPollApiService extends PersistentStatefulService<IChatbotPollApiServiceState> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  socketUrl = this.chatbotBaseApiService.socketUrl;

  static defaultState: IChatbotPollApiServiceState = {
    pollPreferencesResponse: {
      enabled: false,
      settings: null,
    },
    activePollResponse: {
      settings: {
        id: null,
        options: [],
        timer: {
          enabled: null,
          duration: null,
        },
        title: null,
        send_notification: false,
      },
      status: null,
      user_id: null,
    },
    activeView: 'active',
    timeRemaining: '00:00:00',
  };

  socket: SocketIOClient.Socket;
  timer: NodeJS.Timer;

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

    this.UPDATE_TIMER(Date.now());
    // @ts-ignore - weird stuff going on with NodeJs.Timer & number ...
    this.timer = setInterval(() => {
      this.UPDATE_TIMER(Date.now());
    }, 1000);

    this.socket = io.connect(
      this.socketUrl,
      { transports: ['websocket'] },
    );
    this.socket.emit('authenticate', {
      token: this.chatbotBaseApiService.state.socketToken,
    });

    this.socket.on('poll.start', () => {
      this.UPDATE_POLL_STATE('Open');
      this.UPDATE_POLL_VIEW('active');
    });

    this.socket.on('poll.open', () => {
      this.UPDATE_POLL_STATE('Open');
    });

    this.socket.on('poll.close', () => {
      this.UPDATE_POLL_STATE('Closed');
    });

    this.socket.on('poll.cancel', () => {
      this.RESET_ACTIVE_POLL();
    });

    this.socket.on('poll.complete', () => {
      this.RESET_ACTIVE_POLL();
    });

    this.socket.on('poll.update', (response: IPollOption[]) => {
      this.UPDATE_POLL_OPTIONS(response);
    });

    this.socket.on('poll.timer.start', (response: IPollTimer) => {
      this.UPDATE_POLL_TIMER(response);
    });

    this.socket.on('poll.timer.stop', (response: IPollTimer) => {
      this.UPDATE_POLL_TIMER(response);
    });
  }

  disconnectSocket() {
    if (this.isConnected()) {
      this.socket.disconnect();
    }

    clearInterval(this.timer);
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
    return this.chatbotBaseApiService.api('POST', 'poll/profile', data).then(() => {
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
    return this.chatbotBaseApiService.api('POST', `poll/start/${data.id}`, {}).then(() => {
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
  // Reset
  //
  resetSettings() {
    return this.chatbotBaseApiService
      .resetSettings('poll')
      .then((response: IPollPreferencesResponse) => {
        this.UPDATE_POLL_PREFERENCES(response);
        return Promise.resolve(response);
      });
  }

  //
  // Views
  //
  changeView(view: string) {
    this.UPDATE_POLL_VIEW(view);
  }

  //
  //  Timer
  //
  @mutation()
  private UPDATE_TIMER(now: number) {
    const activePoll = this.state.activePollResponse;
    const containsSettings =
      activePoll.settings !== undefined &&
      activePoll.settings.timer !== undefined &&
      activePoll.settings.timer.enabled !== null;

    if (!containsSettings) {
      return;
    }

    const containsTimer = activePoll.settings.timer.enabled;
    const startedTimer = activePoll.settings.timer.started_at !== undefined;

    if (containsSettings && containsTimer && startedTimer) {
      const timeElapsed = now - activePoll.settings.timer.started_at;
      const timerLength = activePoll.settings.timer.time_remaining * 1000;
      const duration = moment.duration(Math.max(0, timerLength - timeElapsed));

      this.state.timeRemaining = moment.utc(duration.asMilliseconds()).format('HH:mm:ss');
    } else if (!activePoll.settings.timer.enabled) {
      const timeElapsed = now - Date.parse(activePoll.created_at);
      const duration = moment.duration(Math.max(0, timeElapsed));
      this.state.timeRemaining = moment.utc(duration.asMilliseconds()).format('HH:mm:ss');
    }
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
  }

  @mutation()
  private UPDATE_POLL_OPTIONS(options: IPollOption[]) {
    this.state.activePollResponse.settings.options = options;
  }

  @mutation()
  private UPDATE_POLL_STATE(status: string) {
    this.state.activePollResponse.status = status;
  }

  @mutation()
  private RESET_ACTIVE_POLL() {
    Vue.set(
      this.state,
      'activePollResponse',
      ChatbotPollApiService.defaultState.activePollResponse,
    );
  }

  @mutation()
  private UPDATE_POLL_TIMER(data: IPollTimer) {
    this.state.activePollResponse.settings.timer = data;
  }

  @mutation()
  private UPDATE_POLL_VIEW(view: string) {
    this.state.activeView = view;
  }
}
