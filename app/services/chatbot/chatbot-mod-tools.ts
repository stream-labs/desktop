import Vue from 'vue';
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { mutation } from '../core/stateful-service';
import { ChatbotBaseApiService } from './chatbot-base';
import {
  IChatbotAPIPostResponse,
  ICapsProtectionResponse,
  ISymbolProtectionResponse,
  ILinkProtectionResponse,
  IWordProtectionResponse,
  ChatbotSettingSlug,
  IParagraphProtectionResponse,
  IEmoteProtectionResponse,
} from './chatbot-interfaces';

// state
interface IChatbotModToolsApiServiceState {
  capsProtectionResponse: ICapsProtectionResponse;
  symbolProtectionResponse: ISymbolProtectionResponse;
  linkProtectionResponse: ILinkProtectionResponse;
  wordProtectionResponse: IWordProtectionResponse;
  emoteProtectionResponse: IEmoteProtectionResponse;
  paragraphProtectionResponse: IParagraphProtectionResponse;
}

export class ChatbotModToolsApiService extends PersistentStatefulService<
  IChatbotModToolsApiServiceState
> {
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  static defaultState: IChatbotModToolsApiServiceState = {
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
    emoteProtectionResponse: {
      enabled: false,
      settings: null,
    },
    paragraphProtectionResponse: {
      enabled: false,
      settings: null,
    },
  };

  //
  // GET requests
  //
  fetchCapsProtection() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/caps-protection', {})
      .then((response: ICapsProtectionResponse) => {
        this.UPDATE_CAPS_PROTECTION(response);
      });
  }

  fetchSymbolProtection() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/symbol-protection', {})
      .then((response: ISymbolProtectionResponse) => {
        this.UPDATE_SYMBOL_PROTECTION(response);
      });
  }

  fetchLinkProtection() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/link-protection', {})
      .then((response: ILinkProtectionResponse) => {
        this.UPDATE_LINK_PROTECTION(response);
      });
  }

  fetchWordProtection() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/words-protection', {})
      .then((response: IWordProtectionResponse) => {
        this.UPDATE_WORD_PROTECTION(response);
      });
  }

  fetchEmoteProtection() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/emote-protection', {})
      .then((response: IEmoteProtectionResponse) => {
        this.UPDATE_EMOTE_PROTECTION(response);
      });
  }

  fetchParagraphProtection() {
    return this.chatbotBaseApiService
      .api('GET', 'settings/paragraph-protection', {})
      .then((response: IParagraphProtectionResponse) => {
        this.UPDATE_PARAGRAPH_PROTECTION(response);
      });
  }

  // reset
  resetSettings(slug: ChatbotSettingSlug) {
    return this.chatbotBaseApiService
      .api('POST', `settings/${slug}/reset`, {})
      .then(
        (
          response:
            | ICapsProtectionResponse
            | ISymbolProtectionResponse
            | ILinkProtectionResponse
            | IWordProtectionResponse
            | IEmoteProtectionResponse
            | IParagraphProtectionResponse,
        ) => {
          switch (slug) {
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
            case 'emote-protection':
              this.UPDATE_EMOTE_PROTECTION(response as IEmoteProtectionResponse);
              break;
            case 'paragraph-protection':
              this.UPDATE_PARAGRAPH_PROTECTION(response as IParagraphProtectionResponse);
              break;
          }
          return Promise.resolve(response);
        },
      );
  }

  // Update
  updateCapsProtection(data: ICapsProtectionResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/caps-protection', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchCapsProtection();
        }
      });
  }

  updateSymbolProtection(data: ISymbolProtectionResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/symbol-protection', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchSymbolProtection();
        }
      });
  }

  updateLinkProtection(data: ILinkProtectionResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/link-protection', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchLinkProtection();
        }
      });
  }

  updateWordProtection(data: IWordProtectionResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/words-protection', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchWordProtection();
        }
      });
  }

  updateEmoteProtection(data: IEmoteProtectionResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/emote-protection', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchEmoteProtection();
        }
      });
  }

  updateParagraphProtection(data: IParagraphProtectionResponse) {
    return this.chatbotBaseApiService
      .api('POST', 'settings/paragraph-protection', data)
      .then((response: IChatbotAPIPostResponse) => {
        if (response.success === true) {
          this.fetchParagraphProtection();
        }
      });
  }

  //
  // Mutations
  //
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
  private UPDATE_EMOTE_PROTECTION(response: IEmoteProtectionResponse) {
    Vue.set(this.state, 'emoteProtectionResponse', response);
  }

  @mutation()
  private UPDATE_PARAGRAPH_PROTECTION(response: IParagraphProtectionResponse) {
    Vue.set(this.state, 'paragraphProtectionResponse', response);
  }
}
