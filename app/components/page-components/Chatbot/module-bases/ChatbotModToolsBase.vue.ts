import cloneDeep from 'lodash/cloneDeep';
import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import {
  ChatbotSettingSlug,
  ICapsProtectionData,
  ICapsProtectionResponse,
  ILinkProtectionData,
  ILinkProtectionResponse,
  ISymbolProtectionData,
  ISymbolProtectionResponse,
  IWordProtectionData,
  IWordProtectionResponse,
} from 'services/chatbot';

import {
  EInputType,
  IListMetadata,
  INumberMetadata,
  ISliderMetadata,
  IInputMetadata,
  ITextMetadata,
} from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';

interface IChatbotPunishmentMetadata {
  type: IListMetadata<string>;
  duration: INumberMetadata;
}

interface IChatbotPermitMetadata {
  duration: INumberMetadata;
}

interface IExcludedMetadata {
  level: IListMetadata<number>;
}

interface IProtectionGeneralMetadata {
  punishment: IChatbotPunishmentMetadata;
  permit: IChatbotPermitMetadata;
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
}

interface ILinkProtectionCommandsMetadata {
  permit: {
    command: ITextMetadata;
    description: ITextMetadata;
    response: ITextMetadata;
    response_type: IListMetadata<string>;
    new_alias: ITextMetadata;
  };
}

interface ILinkProtectionMetadata {
  commands: ILinkProtectionCommandsMetadata;
  general: IProtectionGeneralMetadata;
  new_whitelist_item: ITextMetadata;
  new_blacklist_item: ITextMetadata;
}

interface IWordProtectionBlacklistItem {
  text: ITextMetadata;
  is_regex: IInputMetadata;
  punishment: IChatbotPunishmentMetadata;
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
  capsProtection: ICapsProtectionData = {
    advanced: {
      maximum: 8,
      minimum: 8,
      percent: 50,
    },
    general: {
      excluded: {
        info: {},
        level: 0,
      },
      message: '',
      permit: {
        duration: 120,
      },
      punishment: {
        duration: 0,
        type: 'Purge',
      },
    },
  };
  symbolProtection: ISymbolProtectionData = {
    advanced: {
      maximum: 8,
      minimum: 8,
      percent: 50,
    },
    general: {
      excluded: {
        info: {},
        level: 0,
      },
      message: '',
      permit: {
        duration: 120,
      },
      punishment: {
        duration: 0,
        type: 'Purge',
      },
    },
  };
  linkProtection: ILinkProtectionData = {
    general: {
      excluded: {
        info: {},
        level: 0,
      },
      message: '',
      permit: {
        duration: 120,
      },
      punishment: {
        duration: 0,
        type: 'Purge',
      },
    },
    blacklist: [],
    commands: {},
    whitelist: [],
  };
  wordProtection: IWordProtectionData = {
    general: {
      excluded: {
        info: {},
        level: 0,
      },
      message: '',
      permit: {
        duration: 120,
      },
      punishment: {
        duration: 0,
        type: 'Purge',
      },
    },
    blacklist: [],
  };

  mounted() {
    this.capsProtection = cloneDeep(this.capsProtectionResponse.settings);
    this.symbolProtection = cloneDeep(this.symbolProtectionResponse.settings);
    this.linkProtection = cloneDeep(this.linkProtectionResponse.settings);
    this.wordProtection = cloneDeep(this.wordProtectionResponse.settings);
  }

  get capsProtectionResponse() {
    return this.chatbotApiService.ModTools.state.capsProtectionResponse;
  }

  get symbolProtectionResponse() {
    return this.chatbotApiService.ModTools.state.symbolProtectionResponse;
  }

  get linkProtectionResponse() {
    return this.chatbotApiService.ModTools.state.linkProtectionResponse;
  }

  get wordProtectionResponse() {
    return this.chatbotApiService.ModTools.state.wordProtectionResponse;
  }

  placeholder(protectionType: string, fieldType: 'message' | 'minimum' | 'maximum' | 'percent') {
    return {
      message: {
        caps: $t('The phrase that will appear after a viewer enters too many capitalized letters'),
        symbol: $t('The phrase that will appear after a viewer enters too many symbols'),
        links: $t('The phrase that will appear after a viewer enters blacklisted links'),
      },
      minimum: {
        caps: $t('Set the number of capitalized letters before the system starts to detect'),
        symbol: $t('Set the number of symbols before the system starts to detect'),
      },
      maximum: {
        caps: $t('Set the maximum number of capitalized letters permitted'),
        symbol: $t('Set the maximum number of symbols permitted'),
      },
      percent: {
        caps: $t('Set the maximum percent of capitalized letters within a message'),
        symbol: $t('Set the maximum percent of symbols within a message'),
      },
    }[fieldType][protectionType];
  }

  // metadata
  generalMetadata(protectionType: string): IProtectionGeneralMetadata {
    return {
      punishment: {
        type: {
          type: EInputType.list,
          required: true,
          options: this.chatbotPunishments,
        },
        duration: {
          required: true,
          type: EInputType.number,
          placeholder: $t('Punishment Duration'),
          tooltip: $t('Value in Seconds'),
          min: 0,
          max: 86400,
        },
      },
      permit: {
        duration: {
          required: true,
          type: EInputType.number,
          placeholder: $t('Permission Duration'),
          tooltip: $t('Value in Seconds'),
          min: 1,
          max: 86400,
        },
      },
      excluded: {
        level: {
          required: true,
          options: this.chatbotAutopermitOptions,
          type: EInputType.list,
          tooltip: $t('Set a user group that will not be punished'),
        },
      },
      message: {
        required: true,
        type: EInputType.textArea,
        placeholder: this.placeholder(protectionType, 'message'),
        uuid: $t('Message'),
        max: 450,
        blockReturn: true,
      },
    };
  }

  advancedMetadata(protectionType: string): IProtectionAdvancedMetadata {
    return {
      minimum: {
        required: true,
        type: EInputType.number,
        placeholder: this.placeholder(protectionType, 'minimum'),
        min: 0,
        max: 500,
        tooltip: this.placeholder(protectionType, 'minimum'),
      },
      maximum: {
        required: true,
        type: EInputType.number,
        placeholder: this.placeholder(protectionType, 'maximum'),
        min: 0,
        max: 500,
        tooltip: this.placeholder(protectionType, 'maximum'),
      },
      percent: {
        required: true,
        type: EInputType.slider,
        min: 0,
        max: 100,
        tooltip: this.placeholder(protectionType, 'percent'),
      },
    };
  }

  get linkCommandsMetadata() {
    const linkCommandsMetadata: ILinkProtectionCommandsMetadata = {
      permit: {
        command: {
          required: true,
          type: EInputType.text,
          placeholder: 'Command phrase',
        },
        description: {
          required: true,
          type: EInputType.textArea,
          placeholder: 'Command description',
        },
        response: {
          required: true,
          type: EInputType.textArea,
          placeholder: 'Message in chat',
        },
        response_type: {
          options: this.chatbotResponseTypes,
        },
        new_alias: {
          required: false,
          type: EInputType.text,
          placeholder: 'New Command Alias',
        },
      },
    };

    return linkCommandsMetadata;
  }

  get wordBlacklistItemMetadata() {
    const wordBlacklistItemMetadata: IWordProtectionBlacklistItem = {
      text: {
        required: true,
        type: EInputType.text,
        placeholder: 'word to protect',
      },
      is_regex: {
        required: true,
        type: EInputType.bool,
      },
      punishment: {
        type: {
          required: true,
          type: EInputType.list,
          options: this.chatbotPunishments,
        },
        duration: {
          required: true,
          type: EInputType.number,
          placeholder: 'Punishment Duration (Value in Seconds)',
          min: 0,
        },
      },
    };

    return wordBlacklistItemMetadata;
  }

  get metadata(): IProtectionMetadata {
    return {
      caps: {
        general: this.generalMetadata('caps'),
        advanced: this.advancedMetadata('caps'),
      },
      symbol: {
        general: this.generalMetadata('symbol'),
        advanced: this.advancedMetadata('symbol'),
      },
      link: {
        commands: this.linkCommandsMetadata,
        general: this.generalMetadata('links'),
        new_whitelist_item: {
          required: true,
          type: EInputType.text,
          placeholder: 'Link to whitelist',
        },
        new_blacklist_item: {
          required: true,
          type: EInputType.text,
          placeholder: 'Link to blacklist',
        },
      },
      word: {
        general: this.generalMetadata('words'),
        new_blacklist_item: this.wordBlacklistItemMetadata,
      },
    };
  }

  onResetSlugHandler(slug: ChatbotSettingSlug) {
    if (confirm($t('Are you sure you want to reset this protection preference?'))) {
      this.chatbotApiService.ModTools.resetSettings(slug).then(
        (
          response:
            | ICapsProtectionResponse
            | ISymbolProtectionResponse
            | ILinkProtectionResponse
            | IWordProtectionResponse,
        ) => {
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
        },
      );
    }
  }
}
