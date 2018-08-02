import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';

import {
  ICapsProtectionData,
  ISymbolProtectionData,
  ILinkProtectionData,
  IWordProtectionData,
  ChatbotPunishments,
  ChatbotPermissions
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

interface ILinkProtectionMetadata {
  commands: {
    all_commands: {
      command: ITextMetadata;
      description: ITextMetadata;
      response: ITextMetadata;
      response_type: ITextMetadata;
      new_alias: ITextMetadata;
    }
  },
  general: IProtectionGeneralMetadata;
  new_whitelist_item: ITextMetadata;
  new_blacklist_item: ITextMetadata;
}

interface IWordProtectionMetadata {
  general: IProtectionGeneralMetadata;
  new_blacklist_item: {
    text: ITextMetadata;
    is_regex: IInputMetadata;
    punishment: IPunishmentMetadata;
  }
}

interface IProtectionMetadata {
  caps: ICapsProtectionMetadata;
  symbol: ISymbolProtectionMetadata;
  link?: ILinkProtectionMetadata;
  word?: IWordProtectionMetadata;
}


@Component({
  components: {
    TextInput,
    TextAreaInput,
    ListInput,
    NumberInput
  }
})
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
      default:
        return 'unpermitted value';
    }
  }

  // metadata
  generalMetadata(protectionType: string) {
    return {
      punishment: {
        type: {
          required: true,
          options: Object.keys(ChatbotPunishments).map(punishmentType => {
            return {
              value: ChatbotPunishments[punishmentType],
              title: punishmentType
            };
          })
        },
        duration: {
          required: true,
          placeholder: 'Punishment Duration in minutes',
          min: 0
        }
      },
      excluded: {
        level: {
          required: true,
          options: Object.keys(ChatbotPermissions)
            .map(permission => {
              return {
                value: ChatbotPermissions[permission],
                title: permission
              };
            })
            .filter(listItem => typeof listItem.value === 'number')
        }
      },
      message: {
        required: true,
        placeholder: `The phrase that will appear after a viewer enters too many ${ this.label(protectionType) }.`
      }
    };
  }

  advancedMetadata(protectionType: string) {
    return {
      minimum: {
        required: true,
        placeholder: `Minimum amount of ${ this.label(protectionType) }`,
        min: 0
      },
      maximum: {
        required: true,
        placeholder: `Maximum amount of ${ this.label(protectionType) }`,
        min: 0
      },
      percent: {
        required: true,
        min: 0,
        max: 100
      }
    };
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
      }
    };
    return metadata;
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }
}

