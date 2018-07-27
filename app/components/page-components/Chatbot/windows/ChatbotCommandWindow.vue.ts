import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';

import {
  CustomCommand,
  ChatbotPermissions,
  ChatbotResponseTypes,
} from 'services/chatbot/chatbot-interfaces';


import {
  IListMetadata,
  ITextMetadata,
} from 'components/shared/inputs/index';

@Component({
  components: {
    TextInput,
    TextAreaInput,
    ListInput
  }
})
export default class ChatbotCommandWindow extends ChatbotWindowsBase {
  newCommand: CustomCommand = {
    command: null,
    response: null,
    response_type: 'Chat',
    permission: {
      level: 163,
      info: {}
    },
    cooldowns: {
      global: 0,
      user: 0
    },
    aliases: [],
    platforms: 7,
    enabled: true
  };

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

  // metadata
  commandMetadata: ITextMetadata = {
    required: true,
    placeholder: 'Enter the text string which will trigger the response'
  };
  responseMetadata: ITextMetadata = {
    required: true,
    placeholder: 'The phrase that will appear after a user enters the command'
  };
  permissionMetadata: IListMetadata<number> = {
    options: Object.keys(ChatbotPermissions)
      .map(permission => {
        return {
          value: ChatbotPermissions[permission],
          title: permission
        };
      })
      .filter((listItem) => typeof listItem.value === 'number')
  };

  showToMetadata: IListMetadata<string> = {
    options: Object.keys(ChatbotResponseTypes).map(responseType => {
      return {
        value: ChatbotResponseTypes[responseType],
        title: responseType,
      };
    })
  };

  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    this.chatbotApiService.createCustomCommand(this.newCommand);
  }
}
