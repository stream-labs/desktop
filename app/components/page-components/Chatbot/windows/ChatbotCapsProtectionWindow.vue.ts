import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import { cloneDeep } from 'lodash';

import {
  IChatCapsProtectionData,
  ChatbotPunishments,
  ChatbotPermissions
} from 'services/chatbot/chatbot-interfaces';


import {
  IListMetadata,
  ITextMetadata,
  INumberMetadata,
  ISliderMetadata,
} from 'components/shared/inputs/index';

interface capsProtectionMetadata {
  general: {
    punishment: {
      type: IListMetadata<string>;
      duration: INumberMetadata;
    },
    excluded: {
      level: IListMetadata<number>;
    },
    message: ITextMetadata;
  },
  advanced: {
    minimum: INumberMetadata;
    maximum: INumberMetadata;
    percent: ISliderMetadata;
  }
}

@Component({
  components: {
    TextInput,
    TextAreaInput,
    ListInput,
    NumberInput
  }
})
export default class ChatbotCapsProtectionWindow extends ChatbotWindowsBase {
  tabs: { name: string; value: string }[] = [
    {
      name: 'General',
      value: 'general'
    },
    {
      name: 'Advanced',
      value: 'advanced'
    }
  ];

  selectedTab: string = 'general';

  capsProtection: IChatCapsProtectionData = null;

  mounted() {
    this.capsProtection = cloneDeep(this.capsProtectionResponse.settings);
  }

  get capsProtectionResponse() {
    return this.chatbotApiService.state.capsProtectionResponse;
  }

  // metadata
  get metadata() {
    const metadata: capsProtectionMetadata = {
      general: {
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
          placeholder:
            'The phrase that will appear after a viewer enters too many Capitalized letters.'
        }
      },
      advanced: {
        minimum: {
          required: true,
          placeholder: 'Minimum amount of caps',
          min: 0
        },
        maximum: {
          required: true,
          placeholder: 'Maximum amount of caps',
          min: 0
        },
        percent: {
          required: true,
          min: 0,
          max: 100
        }
      }
    };
    return metadata;
  }

  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    this.chatbotApiService.updateCapsProtection({
      enabled: this.capsProtectionResponse.enabled,
      settings: this.capsProtection
    }).then(() => {
      alert('Updated successfully!');
    });
  }
}
