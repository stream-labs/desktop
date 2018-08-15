import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';

import {
  ICapsProtectionResponse,
  ISymbolProtectionResponse,
  ILinkProtectionResponse,
  IWordProtectionResponse,
  ICapsProtectionData,
  ISymbolProtectionData,
  ILinkProtectionData,
  IWordProtectionData,
  ChatbotSettingSlugs
} from 'services/chatbot/chatbot-interfaces';

import {
  IListMetadata,
  ITextMetadata,
  INumberMetadata,
  ISliderMetadata,
  IInputMetadata
} from 'components/shared/inputs/index';

interface IPunishmentMetadata {
  type: IListMetadata<string>;
  duration: INumberMetadata;
}

interface IExcludedMetadata {
  level: IListMetadata<number>;
}

interface IProtectionGeneralMetadata {
  punishment: IPunishmentMetadata;
  excluded: IExcludedMetadata;
  message: ITextMetadata;
}

interface IProtectionAdvancedMetadata {
  minimum: INumberMetadata;
  maximum: INumberMetadata;
  percent: ISliderMetadata;
}

interface ICapsProtectionMetadata {
  general: IProtectionGeneralMetadata;
  advanced: IProtectionAdvancedMetadata;
}

interface ISymbolProtectionMetadata {
  general: IProtectionGeneralMetadata;
  advanced: IProtectionAdvancedMetadata;
};

interface ILinkProtectionCommandsMetadata {
  permit: {
    command: ITextMetadata;
    description: ITextMetadata;
    response: ITextMetadata;
    response_type: IListMetadata<string>;
    new_alias: ITextMetadata;
  }
}

interface ILinkProtectionMetadata {
  commands: ILinkProtectionCommandsMetadata,
  general: IProtectionGeneralMetadata;
  new_whitelist_item: ITextMetadata;
  new_blacklist_item: ITextMetadata;
}

interface IWordProtectionBlacklistItem {
  text: ITextMetadata;
  is_regex: IInputMetadata;
  punishment: IPunishmentMetadata;
}

interface IWordProtectionMetadata {
  general: IProtectionGeneralMetadata;
  new_blacklist_item: IWordProtectionBlacklistItem;
}

interface IProtectionMetadata {
  caps: ICapsProtectionMetadata;
  symbol: ISymbolProtectionMetadata;
  link: ILinkProtectionMetadata;
  word: IWordProtectionMetadata;
}

@Component({})
export default class ChatbotAlertsBase extends ChatbotWindowsBase {
  capsProtection: ICapsProtectionData = null;
  symbolProtection: ISymbolProtectionData = null;
  linkProtection: ILinkProtectionData = null;
  wordProtection: IWordProtectionData = null;

  mounted() {
    this.capsProtection = cloneDeep(this.capsProtectionResponse.settings);
    this.symbolProtection = cloneDeep(this.symbolProtectionResponse.settings);
    this.linkProtection = cloneDeep(this.linkProtectionResponse.settings);
    this.wordProtection = cloneDeep(this.wordProtectionResponse.settings);
  }

  get capsProtectionResponse() {
    return this.chatbotApiService.state.capsProtectionResponse;
  }

  get symbolProtectionResponse() {
    return this.chatbotApiService.state.symbolProtectionResponse;
  }

  get linkProtectionResponse() {
    return this.chatbotApiService.state.linkProtectionResponse;
  }

  get wordProtectionResponse() {
    return this.chatbotApiService.state.wordProtectionResponse;
  }

  label(protectionType: string) {
    switch (protectionType) {
      case 'caps':
        return 'Capitalized letters';
      case 'symbol':
        return 'Symbols';
      case 'links':
        return 'Links';
      default:
        return 'unpermitted value';
    }
  }

  // metadata
  generalMetadata(protectionType: string) {
    const generalMetadata: IProtectionGeneralMetadata = {
      punishment: {
        type: {
          required: true,
          options: this.chatbotPunishments
        },
        duration: {
          required: true,
          placeholder: 'Punishment Duration (Value in Minutes)',
          min: 0
        }
      },
      excluded: {
        level: {
          required: true,
          options: this.chatbotAutopermitOptions
        }
      },
      message: {
        required: true,
        placeholder: `The phrase that will appear after a viewer enters too many ${this.label(
          protectionType
        )}.`
      }
    };

    return generalMetadata;
  }

  advancedMetadata(protectionType: string) {
    const advancedMetadata: IProtectionAdvancedMetadata = {
      minimum: {
        required: true,
        placeholder: `Minimum amount of ${this.label(protectionType)}`,
        min: 0,
        max: 500
      },
      maximum: {
        required: true,
        placeholder: `Maximum amount of ${this.label(protectionType)}`,
        min: 0,
        max: 500
      },
      percent: {
        required: true,
        min: 0,
        max: 100
      }
    };
    return advancedMetadata;
  }

  get linkCommandsMetadata() {
    let linkCommandsMetadata: ILinkProtectionCommandsMetadata = {
      permit: {
        command: {
          required: true,
          placeholder: 'Command phrase'
        },
        description: {
          required: true,
          placeholder: 'Command description'
        },
        response: {
          required: true,
          placeholder: 'Message in chat'
        },
        response_type: {
          options: this.chatbotResponseTypes
        },
        new_alias: {
          required: false,
          placeholder: 'New Command Alias'
        }
      }
    };
    return linkCommandsMetadata;
  }

  get wordBlacklistItemMetadata() {
    let wordBlacklistItemMetadata: IWordProtectionBlacklistItem = {
      text: {
        required: true,
        placeholder: 'word to protect'
      },
      is_regex: {
        required: true
      },
      punishment: {
        type: {
          required: true,
          options: this.chatbotPunishments
        },
        duration: {
          required: true,
          placeholder: 'Punishment Duration (Value in Minutes)',
          min: 0
        }
      }
    };
    return wordBlacklistItemMetadata;
  }

  get metadata() {
    const metadata: IProtectionMetadata = {
      caps: {
        general: this.generalMetadata('caps'),
        advanced: this.advancedMetadata('caps')
      },
      symbol: {
        general: this.generalMetadata('symbol'),
        advanced: this.advancedMetadata('symbol')
      },
      link: {
        commands: this.linkCommandsMetadata,
        general: this.generalMetadata('links'),
        new_whitelist_item: {
          required: true,
          placeholder: 'Link to whitelist'
        },
        new_blacklist_item: {
          required: true,
          placeholder: 'Link to blacklist'
        }
      },
      word: {
        general: this.generalMetadata('words'),
        new_blacklist_item: this.wordBlacklistItemMetadata
      }
    };
    return metadata;
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onResetSlug(slug: ChatbotSettingSlugs) {
    this.chatbotApiService.resetSettings(slug)
      .then((response: (
        ICapsProtectionResponse |
        ISymbolProtectionResponse |
        ILinkProtectionResponse |
        IWordProtectionResponse
      )) => {
        switch (slug) {
          case 'caps-protection':
            this.capsProtection = cloneDeep(response.settings as ICapsProtectionData);
            break;
          case 'symbol-protection':
            this.symbolProtection = cloneDeep(response.settings as ISymbolProtectionData);
            break;
          case 'link-protection':
            this.linkProtection = cloneDeep(response.settings as ILinkProtectionData);
            break;
          case 'words-protection':
            this.wordProtection = cloneDeep(response.settings as IWordProtectionData);
            break;
          default:
            break;
        }
      })
  }
}
