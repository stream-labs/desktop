import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import {
  MediaShareService,
  IMediaShareData,
  IMediaShareBan
} from 'services/widget-settings/media-share';
import io from 'socket.io-client';

import {
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
  ISongRequestResponse
} from './chatbot-interfaces';

// state
interface IChatbotAlertsApiServiceState {
  // v1
  apiToken: string;
  socketToken: string;
  globallyEnabled: boolean;
  defaultCommandsResponse: IDafaultCommandsResponse;
  customCommandsResponse: ICustomCommandsResponse;
  timersResponse: ITimersResponse;
  commandVariablesResponse: ICommandVariablesResponse;
  chatAlertsResponse: IChatAlertsResponse;
  capsProtectionResponse: ICapsProtectionResponse;
  symbolProtectionResponse: ISymbolProtectionResponse;
  linkProtectionResponse: ILinkProtectionResponse;
  wordProtectionResponse: IWordProtectionResponse;

  // v2
  quotesResponse: IQuotesResponse;
  quotePreferencesResponse: IQuotePreferencesResponse;
  queuePreferencesResponse: IQueuePreferencesResponse;
  queueStateResponse: IQueueStateResponse;
  queueEntriesResponse: IQueueEntriesResponse;
  queuePickedResponse: IQueuePickedResponse;
  songRequestPreferencesResponse: ISongRequestPreferencesResponse;
  songRequestResponse: ISongRequestResponse;
}

export class ChatbotAlertsApiService extends PersistentStatefulService<
  IChatbotAlertsApiServiceState
> {
  @Inject() userService: UserService;
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() mediaShareService: MediaShareService;

  apiUrl = 'https://chatbot-api.streamlabs.com/';
  socketUrl = 'https://chatbot-io.streamlabs.com';
  version = 'api/v1/';

  static defaultState: IChatbotAlertsApiServiceState = {
    apiToken: null,
    socketToken: null,
    globallyEnabled: false,
    defaultCommandsResponse: {
      commands: {},
      'link-protection': {},
      giveaway: {}
    },
    customCommandsResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    commandVariablesResponse: [],
    timersResponse: {
      pagination: {
        current: 1,
        total: 1
      },
      data: []
    },
    chatAlertsResponse: {
      enabled: false,
      settings: null
    },
    capsProtectionResponse: {
      enabled: false,
      settings: null
    },
    symbolProtectionResponse: {
      enabled: false,
      settings: null
    },
    linkProtectionResponse: {
      enabled: false,
      settings: null
    },
    wordProtectionResponse: {
      enabled: false,
      settings: null
    },
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
    songRequestPreferencesResponse: {
      banned_media: [],
      settings: null
    },
    songRequestResponse: {
      enabled: false,
      settings: null
    }
  };


  //
  // GET requests
  //
  fetchChatAlerts() {
    return this.api('GET', 'settings/chat-notifications', {}).then(
      (response: IChatAlertsResponse) => {
        this.UPDATE_CHAT_ALERTS(response);
      }
    );
  }

  // Update
  updateChatAlerts(data: IChatAlertsResponse) {
    return this.api('POST', 'settings/chat-notifications', data).then(
      (response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchChatAlerts();
        }
      }
    );
  }

  //
  // Mutations
  //

  @mutation()
  private UPDATE_CHAT_ALERTS(response: IChatAlertsResponse) {
    Vue.set(this.state, 'chatAlertsResponse', response);
  }

}
