import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';
import * as _ from 'lodash';
import * as moment from 'moment';
import io from 'socket.io-client';

import {
  IChatbotAPIPostResponse,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  IBettingProfile,
  IBettingPreferencesResponse,
  IActiveBettingResponse
} from './chatbot-interfaces';

// state
interface IChatbotBettingApiServiceState {
  bettingPreferencesResponse: IBettingPreferencesResponse;
  activeBettingResponse: IActiveBettingResponse;
  activeView: string;
  timeRemaining: string;
}

export class ChatbotBettingApiService extends PersistentStatefulService<
  IChatbotBettingApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;
  socketUrl = this.chatbotBaseApiService.socketUrl;

  static defaultState: IChatbotBettingApiServiceState = {
    bettingPreferencesResponse: {
      enabled: false,
      settings: null
    },
    activeBettingResponse: {
      settings: {
        id: null,
        options: [],
        timer: {
          enabled: null,
          duration: null
        },
        loyalty: {
          min: 1,
          max: 1000
        },
        title: null,
        send_notification: false
      },
      status: null,
      user_id: null
    },
    activeView: 'active',
    timeRemaining: '00:00:00'
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
      } else {
        this.socket.removeAllListeners();
      }
    }

    this.UPDATE_TIMER();
    //@ts-ignore - weird stuff going on with NodeJs.Timer & number ...
    this.timer = setInterval(this.UPDATE_TIMER, 1000);

    this.socket = io.connect(this.socketUrl, { transports: ['websocket'] });
    this.socket.emit('authenticate', {
      token: this.chatbotBaseApiService.state.socketToken
    });

    this.socket.on('betting.start', () => {
      this.UPDATE_BETTING_STATE('Open');
      this.UPDATE_BETTING_VIEW('active');
    });

    this.socket.on('betting.open', () => {
      this.UPDATE_BETTING_STATE('Open');
    });

    this.socket.on('betting.close', () => {
      this.UPDATE_BETTING_STATE('Closed');
    });

    this.socket.on('betting.picked', () => {
      this.UPDATE_BETTING_STATE('Picked');
    });

    this.socket.on('betting.cancel', (response: any) => {
      this.RESET_ACTIVE_BETTING();
    });

    this.socket.on('betting.complete', (response: any) => {
      this.RESET_ACTIVE_BETTING();
    });

    this.socket.on('betting.update', (response: any) => {
      this.UPDATE_BETTING_OPTIONS(response);
    });

    this.socket.on('betting.timer.start', (response: any) => {
      this.UPDATE_BETTING_TIMER(response);
    });

    this.socket.on('betting.timer.stop', (response: any) => {
      this.UPDATE_BETTING_TIMER(response);
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
  fetchPreferences() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/betting', {})
      .then((response: IBettingPreferencesResponse) => {
        this.UPDATE_BETTING_PREFERENCES(response);
      });
  }

  fetchActive() {
    return this.chatbotBaseApiService
      .api('GET', 'betting/active', {})
      .then((response: IActiveBettingResponse) => {
        this.UPDATE_ACTIVE_BETTING(response);
      });
  }

  //
  // Update
  //
  updatePreferences(data: IBettingPreferencesResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/betting', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  addProfile(data: IBettingProfile) {
    return this.chatbotBaseApiService
      .api('POST', 'betting/profile', data)
      .then(() => {
        this.fetchPreferences();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  updateProfile(data: IBettingProfile) {
    return this.chatbotBaseApiService
      .api('PUT', `betting/profile/${data.id}`, data)
      .then((response: IChatbotAPIPutResponse) => {
        if (response) {
          this.fetchPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  start(data: IBettingProfile) {
    return this.chatbotBaseApiService
      .api('POST', `betting/start/${data.id}`, {})
      .then(() => {
        this.fetchActive();
        this.chatbotCommonService.closeChildWindow();
      });
  }

  open() {
    return this.chatbotBaseApiService.api('PUT', 'betting/active/open', {});
  }

  close() {
    return this.chatbotBaseApiService.api('PUT', 'betting/active/close', {});
  }

  cancel() {
    return this.chatbotBaseApiService.api('PUT', 'betting/active/cancel', {});
  }

  complete() {
    return this.chatbotBaseApiService.api('PUT', 'betting/active/complete', {});
  }

  pickWinner(option: string) {
    return this.chatbotBaseApiService.api('POST', 'betting/active/pick', {
      option: option
    });
  }

  //
  // Delete
  //
  deleteProfile(data: IBettingProfile) {
    return this.chatbotBaseApiService
      .api('DELETE', `betting/profile/${data.id}`, {})
      .then((response: IChatbotAPIDeleteResponse) => {
        if (response.success === true) {
          this.fetchPreferences();
          this.chatbotCommonService.closeChildWindow();
        }
      });
  }

  //
  // Reset
  //
  resetSettings() {
    return this.chatbotBaseApiService
      .resetSettings('betting')
      .then((response: IBettingPreferencesResponse) => {
        console.log(response);
        this.UPDATE_BETTING_PREFERENCES(response);
        return Promise.resolve(response);
      });
  }

  //
  // Views
  //
  changeView(view: string) {
    this.UPDATE_BETTING_VIEW(view);
  }

  //
  //  Timer
  //
  @mutation()
  private UPDATE_TIMER() {
    const activePoll = this.state.activeBettingResponse;
    const containsSettings =
      activePoll.settings !== undefined &&
      activePoll.settings.timer !== undefined;

    if (!containsSettings) {
      return;
    }

    const containsTimer = activePoll.settings.timer.enabled;
    const startedTimer = activePoll.settings.timer.started_at !== undefined;

    if (containsSettings && containsTimer && startedTimer) {
      console.log('made it here');
      const timeElapsed = Date.now() - activePoll.settings.timer.started_at;
      const timerLength = activePoll.settings.timer.time_remaining * 1000;

      const duration = moment.duration(Math.max(0, timerLength - timeElapsed));
      this.state.timeRemaining = moment
        .utc(duration.asMilliseconds())
        .format('HH:mm:ss');
    } else if (!activePoll.settings.timer.enabled) {
      const timeElapsed = Date.now() - Date.parse(activePoll.created_at);
      const duration = moment.duration(Math.max(0, timeElapsed));
      this.state.timeRemaining = moment
        .utc(duration.asMilliseconds())
        .format('HH:mm:ss');
    }
  }

  //
  // Mutations
  //
  @mutation()
  private UPDATE_BETTING_PREFERENCES(response: IBettingPreferencesResponse) {
    Vue.set(this.state, 'bettingPreferencesResponse', response);
  }

  @mutation()
  private UPDATE_ACTIVE_BETTING(response: IActiveBettingResponse) {
    Vue.set(this.state, 'activeBettingResponse', response);
  }

  @mutation()
  private UPDATE_BETTING_OPTIONS(options: any) {
    this.state.activeBettingResponse.settings.options = options;
  }

  @mutation()
  private UPDATE_BETTING_STATE(status: string) {
    this.state.activeBettingResponse.status = status;
  }

  @mutation()
  private RESET_ACTIVE_BETTING() {
    Vue.set(
      this.state,
      'activeBettingResponse',
      ChatbotBettingApiService.defaultState.activeBettingResponse
    );
  }

  @mutation()
  private UPDATE_BETTING_TIMER(data: any) {
    this.state.activeBettingResponse.settings.timer = data;
  }

  @mutation()
  private UPDATE_BETTING_VIEW(view: string) {
    this.state.activeView = view;
  }
}
