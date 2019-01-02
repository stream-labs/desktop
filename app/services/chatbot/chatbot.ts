import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { mutation } from '../stateful-service';
import { WindowsService } from 'services/windows';
import {
  MediaShareService,
  IMediaShareData,
  IMediaShareBan,
} from 'services/widgets/settings/media-share';
import io from 'socket.io-client';

import {
  IChatbotApiServiceState,
  IChatbotCommonServiceState,
  IChatbotAuthResponse,
  IChatbotErrorResponse,
  IChatbotStatusResponse,
  ChatbotClients,
  ICustomCommand,
  IDefaultCommand,
  IChatbotTimer,
  IDafaultCommandsResponse,
  ICustomCommandsResponse,
  ITimersResponse,
  IChatbotAPIPostResponse,
  IChatbotAPIPutResponse,
  IChatbotAPIDeleteResponse,
  ICommandVariablesResponse,
  IChatAlertsResponse,
  ICapsProtectionResponse,
  ISymbolProtectionResponse,
  ILinkProtectionResponse,
  IWordProtectionResponse,
  IQuotesResponse,
  ChatbotSettingSlug,
  IQuote,
  IQuotePreferencesResponse,
  IQueuePreferencesResponse,
  IQueueStateResponse,
  IQueueEntriesResponse,
  IQueuePickedResponse,
  IChatbotSocketAuthResponse,
  ChatbotSocketRoom,
  ISongRequestPreferencesResponse,
  ISongRequestResponse,
} from './chatbot-interfaces';
import { $t } from '../i18n';

export class ChatbotApiService extends PersistentStatefulService<IChatbotApiServiceState> {
  @Inject() userService: UserService;
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() mediaShareService: MediaShareService;

  apiUrl = 'https://chatbot-api.streamlabs.com/';
  socketUrl = 'https://chatbot-io.streamlabs.com';
  version = 'api/v1/';

  static defaultState: IChatbotApiServiceState = {
    apiToken: null,
    socketToken: null,
    globallyEnabled: false,
    defaultCommandsResponse: {
      commands: {},
      'link-protection': {},
      giveaway: {},
    },
    customCommandsResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
    commandVariablesResponse: [],
    timersResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
    chatAlertsResponse: {
      enabled: false,
      settings: null,
    },
    capsProtectionResponse: {
      enabled: false,
      settings: null,
    },
    symbolProtectionResponse: {
      enabled: false,
      settings: null,
    },
    linkProtectionResponse: {
      enabled: false,
      settings: null,
    },
    wordProtectionResponse: {
      enabled: false,
      settings: null,
    },
    quotesResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
    quotePreferencesResponse: {
      enabled: false,
      settings: null,
    },
    queuePreferencesResponse: {
      enabled: false,
      settings: null,
    },
    queueStateResponse: {
      status: 'Closed',
    },
    queueEntriesResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
    queuePickedResponse: {
      pagination: {
        current: 1,
        total: 1,
      },
      data: [],
    },
    songRequestPreferencesResponse: {
      banned_media: [],
      settings: null,
    },
    songRequestResponse: {
      enabled: false,
      settings: null,
    },
  };

  //
  // service methods
  //

  logIn() {
    return new Promise((resolve, reject) => {
      const url = this.apiEndpoint('login');
      const headers = authorizedHeaders(this.userService.apiToken);
      headers.append('Content-Type', 'application/json');
      const request = new Request(url, {
        headers,
        method: 'POST',
        body: JSON.stringify({}),
      });

      fetch(request)
        .then(handleResponse)
        .then((json: IChatbotAuthResponse) => {
          this.LOGIN(json);
          resolve(true);
        })
        .catch(err => reject(err));
    });
  }

  logOut() {
    this.LOGOUT();
  }

  apiEndpoint(route: String, versionIncluded?: Boolean) {
    return `${this.apiUrl}${versionIncluded ? this.version : ''}${route}`;
  }

  api(method: string, endpoint: string, data: any) {
    const url = this.apiEndpoint(endpoint, true);
    const headers = authorizedHeaders(this.state.apiToken);
    const options: {
      headers: any;
      method: string;
      body?: string;
    } = {
      headers,
      method,
    };
    if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
      options.headers.append('Content-Type', 'application/json');
      options.body = JSON.stringify(data || {});
    }
    const request = new Request(url, options);

    return fetch(request).then(handleResponse);
  }

  //
  // sockets
  //
  logInToSocket(rooms: ChatbotSocketRoom[]) {
    // requires log in
    return this.api('GET', `socket-token?rooms=${rooms.join(',')}`, {}).then(
      (response: IChatbotSocketAuthResponse) => {
        this.LOGIN_TO_SOCKET(response);
      },
    );
  }

  connectToQueueSocketChannels() {
    const socket = io.connect(this.socketUrl);
    socket.emit('authenticate', { token: this.state.socketToken });

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

  fetchChatbotGlobalEnabled() {
    return this.api('GET', 'status', {}).then((response: IChatbotStatusResponse) => {
      // check for clients

      const clientFound = response.clients.services.some(value => {
        return value.toLowerCase() === this.userService.platform.type;
      });

      // all status online.
      this.UPDATE_GLOBALLY_ENABLED(
        response.worker.status === 'Online' &&
          response.worker.type === 'Full' &&
          response.clients.status === 'Online' &&
          clientFound,
      );
    });
  }

  fetchDefaultCommands() {
    return this.api('GET', 'commands/default', {}).then((response: IDafaultCommandsResponse) => {
      this.UPDATE_DEFAULT_COMMANDS(response);
    });
  }

  fetchCustomCommands(page = this.state.customCommandsResponse.pagination.current, query = '') {
    return this.api('GET', `commands?page=${page}&query=${query}`, {}).then(
      (response: ICustomCommandsResponse) => {
        this.UPDATE_CUSTOM_COMMANDS(response);
      },
    );
  }

  fetchCommandVariables() {
    return this.api('GET', 'commands/variables', {}).then((response: ICommandVariablesResponse) => {
      this.UPDATE_COMMAND_VARIABLES(response);
    });
  }

  fetchTimers(page = this.state.timersResponse.pagination.current, query = '') {
    return this.api('GET', `timers?page=${page}&query=${query}`, {}).then(
      (response: ITimersResponse) => {
        this.UPDATE_TIMERS(response);
      },
    );
  }

  fetchChatAlerts() {
    return this.api('GET', 'settings/chat-notifications', {}).then(
      (response: IChatAlertsResponse) => {
        this.UPDATE_CHAT_ALERTS(response);
      },
    );
  }

  fetchCapsProtection() {
    return this.api('GET', 'settings/caps-protection', {}).then(
      (response: ICapsProtectionResponse) => {
        this.UPDATE_CAPS_PROTECTION(response);
      },
    );
  }

  fetchSymbolProtection() {
    return this.api('GET', 'settings/symbol-protection', {}).then(
      (response: ISymbolProtectionResponse) => {
        this.UPDATE_SYMBOL_PROTECTION(response);
      },
    );
  }

  fetchLinkProtection() {
    return this.api('GET', 'settings/link-protection', {}).then(
      (response: ILinkProtectionResponse) => {
        this.UPDATE_LINK_PROTECTION(response);
      },
    );
  }

  fetchWordProtection() {
    return this.api('GET', 'settings/words-protection', {}).then(
      (response: IWordProtectionResponse) => {
        this.UPDATE_WORD_PROTECTION(response);
      },
    );
  }

  fetchQuotes(page = this.state.quotesResponse.pagination.current, query = '') {
    return this.api('GET', `quotes?page=${page}&query=${query}`, {}).then(
      (response: IQuotesResponse) => {
        this.UPDATE_QUOTES(response);
      },
    );
  }

  fetchQuotePreferences() {
    return this.api('GET', 'settings/quotes', {}).then((response: IQuotePreferencesResponse) => {
      this.UPDATE_QUOTE_PREFERENCES(response);
    });
  }

  fetchQueuePreferences() {
    return this.api('GET', 'settings/queue', {}).then((response: IQueuePreferencesResponse) => {
      this.UPDATE_QUEUE_PREFERENCES(response);
    });
  }

  fetchQueueState() {
    return this.api('GET', 'queue', {}).then((response: IQueueStateResponse) => {
      this.UPDATE_QUEUE_STATE(response);
    });
  }

  fetchQueueEntries(page = this.state.queueEntriesResponse.pagination.current, query = '') {
    return this.api('GET', `queue/entries?page=${page}&query=${query}`, {}).then(
      (response: IQueueEntriesResponse) => {
        this.UPDATE_QUEUE_ENTRIES(response);
      },
    );
  }

  fetchQueuePicked(page = this.state.queuePickedResponse.pagination.current) {
    return this.api('GET', `queue/picked?page=${page}`, {}).then(
      (response: IQueuePickedResponse) => {
        this.UPDATE_QUEUE_PICKED(response);
      },
    );
  }

  fetchSongRequestPreferencesData() {
    return this.mediaShareService.fetchData().then((response: IMediaShareData) => {
      this.UPDATE_SONG_REQUEST_PREFERENCES(response as ISongRequestPreferencesResponse);
    });
  }

  fetchSongRequest() {
    // mostly used for enable/disable only
    return this.api('GET', 'settings/songrequest', {}).then((response: ISongRequestResponse) => {
      this.UPDATE_SONG_REQUEST(response);
    });
  }

  //
  // POST, PUT requests
  //
  resetSettings(slug: ChatbotSettingSlug) {
    return this.api('POST', `settings/${slug}/reset`, {}).then(
      (
        response:
          | IChatAlertsResponse
          | ICapsProtectionResponse
          | ISymbolProtectionResponse
          | ILinkProtectionResponse
          | IWordProtectionResponse,
      ) => {
        switch (slug) {
          case 'chat-notifications':
            this.UPDATE_CHAT_ALERTS(response as IChatAlertsResponse);
          case 'caps-protection':
            this.UPDATE_CAPS_PROTECTION(response as ICapsProtectionResponse);
            break;
          case 'symbol-protection':
            this.UPDATE_SYMBOL_PROTECTION(response as ISymbolProtectionResponse);
            break;
          case 'link-protection':
            this.UPDATE_LINK_PROTECTION(response as ILinkProtectionResponse);
            break;
          case 'words-protection':
            this.UPDATE_WORD_PROTECTION(response as IWordProtectionResponse);
            break;
        }
        return Promise.resolve(response);
      },
    );
  }

  toggleEnableChatbot() {
    const platforms = ChatbotClients.map(client => client.toLowerCase());

    const containsPlatform = platforms.some(value => {
      return value.toLowerCase() === this.userService.platform.type;
    });

    if (containsPlatform) {
      return Promise.all([
        this.state.globallyEnabled
          ? this.leavePlatformChannel(this.userService.platform.type)
          : this.joinPlatformChannel(this.userService.platform.type),
      ]).then((response: IChatbotAPIPostResponse[]) => {
        this.fetchChatbotGlobalEnabled();
      });
    }
  }

  joinPlatformChannel(platform: string) {
    return this.api('POST', `bot/${platform}/join`, {});
  }

  leavePlatformChannel(platform: string) {
    return this.api('POST', `bot/${platform}/part`, {});
  }

  resetDefaultCommands() {
    return this.api('POST', 'commands/default/reset', {}).then(
      (response: IDafaultCommandsResponse) => {
        this.UPDATE_DEFAULT_COMMANDS(response);
      },
    );
  }

  resetDefaultCommand(slugName: string, commandName: string) {
    return this.api('POST', `settings/${slugName}/commands/${commandName}/reset`, {}).then(
      (response: IDefaultCommand) => {
        return Promise.resolve(response);
      },
    );
  }

  // create
  createCustomCommand(data: ICustomCommand) {
    return this.api('POST', 'commands', data).then((response: ICustomCommand) => {
      this.fetchCustomCommands();
      this.chatbotCommonService.closeChildWindow();
    });
  }

  createTimer(data: IChatbotTimer) {
    return this.api('POST', 'timers', data).then((response: IChatbotTimer) => {
      this.fetchTimers();
      this.chatbotCommonService.closeChildWindow();
    });
  }

  createQuote(data: IQuote) {
    return this.api('POST', 'quotes', data).then((response: IQuote) => {
      this.fetchQuotes();
      this.chatbotCommonService.closeChildWindow();
    });
  }

  // Update
  updateDefaultCommand(slugName: string, commandName: string, data: IDefaultCommand) {
    return this.api('POST', `settings/${slugName}/commands/${commandName}`, data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchDefaultCommands();
          this.chatbotCommonService.closeChildWindow();
        }
      },
    );
  }

  updateCustomCommand(id: string, data: ICustomCommand) {
    return this.api('PUT', `commands/${id}`, data).then((response: IChatbotAPIPutResponse) => {
      if (response.success) {
        this.fetchCustomCommands();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  updateTimer(id: string, data: IChatbotTimer) {
    return this.api('PUT', `timers/${id}`, data).then((response: IChatbotAPIPutResponse) => {
      if (response.success) {
        this.fetchTimers();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  updateChatAlerts(data: IChatAlertsResponse) {
    return this.api('POST', 'settings/chat-notifications', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchChatAlerts();
        }
      },
    );
  }

  updateCapsProtection(data: ICapsProtectionResponse) {
    return this.api('POST', 'settings/caps-protection', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchCapsProtection();
        }
      },
    );
  }

  updateSymbolProtection(data: ISymbolProtectionResponse) {
    return this.api('POST', 'settings/symbol-protection', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchSymbolProtection();
        }
      },
    );
  }

  updateLinkProtection(data: ILinkProtectionResponse) {
    return this.api('POST', 'settings/link-protection', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchLinkProtection();
        }
      },
    );
  }

  updateWordProtection(data: IWordProtectionResponse) {
    return this.api('POST', 'settings/words-protection', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchWordProtection();
        }
      },
    );
  }

  updateQuote(id: number, data: IQuote) {
    return this.api('PUT', `quotes/${id}`, data).then((response: IChatbotAPIPutResponse) => {
      if (response.success) {
        this.fetchQuotes();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  updateQuotePreferences(data: IQuotePreferencesResponse) {
    return this.api('POST', 'settings/quotes', data).then((response: IChatbotAPIPostResponse) => {
      if (response.success) {
        this.fetchQuotePreferences();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  updateQueuePreferences(data: IQueuePreferencesResponse) {
    return this.api('POST', 'settings/queue', data).then((response: IChatbotAPIPostResponse) => {
      if (response.success) {
        this.fetchQueuePreferences();
        this.chatbotCommonService.closeChildWindow();
      }
    });
  }

  openQueue(title: string) {
    return this.api('PUT', 'queue/open', { title });
  }

  closeQueue() {
    return this.api('PUT', 'queue/close', {});
  }

  pickQueueEntry(id: number) {
    return this.api('PUT', `queue/pick/${id}`, {});
  }

  pickQueueEntryRandom() {
    return this.api('PUT', 'queue/pick/random', {});
  }

  unbanMedia(media: IMediaShareBan) {
    this.mediaShareService.unbanMedia(media);
  }

  updateSongRequestPreferencesData(data: any) {
    // NOTE: should update type
    this.mediaShareService.saveSettings(data.settings);
  }

  updateSongRequest(data: ISongRequestResponse) {
    return this.api('POST', 'settings/songrequest', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success) {
          this.fetchSongRequest();
        }
      },
    );
  }

  //
  // DELETE methods
  //
  deleteCustomCommand(id: string) {
    return this.api('DELETE', `commands/${id}`, {}).then((response: IChatbotAPIDeleteResponse) => {
      if (response.success) {
        this.fetchCustomCommands();
      }
    });
  }

  deleteTimer(id: string) {
    return this.api('DELETE', `timers/${id}`, {}).then((response: IChatbotAPIDeleteResponse) => {
      if (response.success) {
        this.fetchTimers();
      }
    });
  }

  deleteQuote(id: number) {
    return this.api('DELETE', `quotes/${id}`, {}).then((response: IChatbotAPIDeleteResponse) => {
      if (response.success) {
        this.fetchQuotes();
      }
    });
  }

  clearQueueEntries() {
    return this.api('DELETE', 'queue/entries', {});
  }

  clearQueuePicked() {
    return this.api('DELETE', 'queue/picked', {});
  }

  removeQueueEntry(id: number) {
    return this.api('DELETE', `queue/${id}`, {});
  }

  //
  // Mutations
  //

  @mutation()
  private LOGIN(response: IChatbotAuthResponse) {
    Vue.set(this.state, 'apiToken', response.api_token);
  }

  @mutation()
  private LOGIN_TO_SOCKET(response: IChatbotSocketAuthResponse) {
    Vue.set(this.state, 'socketToken', response.socket_token);
  }

  @mutation()
  private LOGOUT() {
    Vue.set(this.state, 'apiToken', null);
    Vue.set(this.state, 'socketToken', null);
  }

  @mutation()
  private UPDATE_GLOBALLY_ENABLED(enabled: boolean) {
    Vue.set(this.state, 'globallyEnabled', enabled);
  }

  @mutation()
  private UPDATE_DEFAULT_COMMANDS(response: IDafaultCommandsResponse) {
    Vue.set(this.state, 'defaultCommandsResponse', response);
  }

  @mutation()
  private UPDATE_CUSTOM_COMMANDS(response: ICustomCommandsResponse) {
    Vue.set(this.state, 'customCommandsResponse', response);
  }

  @mutation()
  private UPDATE_COMMAND_VARIABLES(response: ICommandVariablesResponse) {
    Vue.set(this.state, 'commandVariablesResponse', response);
  }

  @mutation()
  private UPDATE_TIMERS(response: ITimersResponse) {
    Vue.set(this.state, 'timersResponse', response);
  }

  @mutation()
  private UPDATE_CHAT_ALERTS(response: IChatAlertsResponse) {
    Vue.set(this.state, 'chatAlertsResponse', response);
  }

  @mutation()
  private UPDATE_CAPS_PROTECTION(response: ICapsProtectionResponse) {
    Vue.set(this.state, 'capsProtectionResponse', response);
  }

  @mutation()
  private UPDATE_SYMBOL_PROTECTION(response: ISymbolProtectionResponse) {
    Vue.set(this.state, 'symbolProtectionResponse', response);
  }

  @mutation()
  private UPDATE_LINK_PROTECTION(response: ILinkProtectionResponse) {
    Vue.set(this.state, 'linkProtectionResponse', response);
  }

  @mutation()
  private UPDATE_WORD_PROTECTION(response: IWordProtectionResponse) {
    Vue.set(this.state, 'wordProtectionResponse', response);
  }

  @mutation()
  private UPDATE_QUOTES(response: IQuotesResponse) {
    Vue.set(this.state, 'quotesResponse', response);
  }

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

  @mutation()
  private UPDATE_SONG_REQUEST_PREFERENCES(response: ISongRequestPreferencesResponse) {
    Vue.set(this.state, 'songRequestPreferencesResponse', response);
  }

  @mutation()
  private UPDATE_SONG_REQUEST(response: ISongRequestResponse) {
    Vue.set(this.state, 'songRequestResponse', response);
  }
}

export class ChatbotCommonService extends PersistentStatefulService<IChatbotCommonServiceState> {
  @Inject() windowsService: WindowsService;

  static defaultState: IChatbotCommonServiceState = {
    toasted: null,
    customCommandToUpdate: null,
    defaultCommandToUpdate: null,
    timerToUpdate: null,
    quoteToUpdate: null,
    modBannerVisible: true,
  };

  hideModBanner() {
    this.HIDE_MOD_BANNER();
  }

  showModBanner() {
    this.SHOW_MOD_BANNER();
  }

  closeChildWindow() {
    this.windowsService.closeChildWindow();
  }

  openCustomCommandWindow(command?: ICustomCommand) {
    if (command) {
      this.SET_CUSTOM_COMAND_TO_UPDATE(command);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotCustomCommandWindow',
      title: 'Chatbot Custom Command Window',
      size: {
        width: 650,
        height: 600,
      },
    });
  }

  openDefaultCommandWindow(command: IDefaultCommand) {
    if (command) {
      this.SET_DEFAULT_COMAND_TO_UPDATE(command);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotDefaultCommandWindow',
      title: 'Chatbot Default Command Window',
      size: {
        width: 650,
        height: 650,
      },
    });
  }

  openTimerWindow(timer?: IChatbotTimer) {
    if (timer) {
      this.SET_TIMER_TO_UPDATE(timer);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotTimerWindow',
      title: 'Chatbot Timer Window',
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openChatbotAlertsWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotAlertsWindow',
      title: 'Chatbot Alerts Window',
      size: {
        width: 1000,
        height: 700,
      },
    });
  }

  openCapsProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotCapsProtectionWindow',
      title: 'Chatbot Caps Protection Window',
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openSymbolProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotSymbolProtectionWindow',
      title: 'Chatbot Symbol Protection Window',
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openLinkProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotLinkProtectionWindow',
      title: 'Chatbot Link Protection Window',
      size: {
        width: 650,
        height: 650,
      },
    });
  }

  openWordProtectionWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotWordProtectionWindow',
      title: 'Chatbot Word Protection Window',
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openQuoteWindow(quote?: IQuote) {
    if (quote) {
      this.SET_QUOTE_TO_UPDATE(quote);
    }
    this.windowsService.showWindow({
      componentName: 'ChatbotQuoteWindow',
      title: 'Chatbot Quote Window',
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openQueuePreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotQueuePreferencesWindow',
      title: 'Chatbot Queue Preferences Window',
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openQuotePreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotQuotePreferencesWindow',
      title: 'Chatbot Quote Preferences Window',
      size: {
        width: 650,
        height: 300,
      },
    });
  }

  openSongRequestPreferencesWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotSongRequestPreferencesWindow',
      title: $t('Media Share Preferences'),
      preservePrevWindow: true,
      size: {
        width: 650,
        height: 500,
      },
    });
  }

  openSongRequestOnboardingWindow() {
    this.windowsService.showWindow({
      componentName: 'ChatbotSongRequestOnboardingWindow',
      title: 'Chat Song Request Onboarding Window',
      size: {
        width: 750,
        height: 550,
      },
    });
  }

  @mutation()
  private HIDE_MOD_BANNER() {
    Vue.set(this.state, 'modBannerVisible', false);
  }

  @mutation()
  private SHOW_MOD_BANNER() {
    Vue.set(this.state, 'modBannerVisible', true);
  }

  @mutation()
  private SET_CUSTOM_COMAND_TO_UPDATE(command: ICustomCommand) {
    Vue.set(this.state, 'customCommandToUpdate', command);
  }

  @mutation()
  private SET_DEFAULT_COMAND_TO_UPDATE(command: IDefaultCommand) {
    Vue.set(this.state, 'defaultCommandToUpdate', command);
  }

  @mutation()
  private SET_TIMER_TO_UPDATE(timer: IChatbotTimer) {
    Vue.set(this.state, 'timerToUpdate', timer);
  }

  @mutation()
  private SET_QUOTE_TO_UPDATE(quote: IQuote) {
    Vue.set(this.state, 'quoteToUpdate', quote);
  }
}
