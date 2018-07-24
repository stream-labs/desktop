import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import WTextInput from 'components/shared/widget-inputs/WTextInput.vue';
import WTextAreaInput from 'components/shared/widget-inputs/WTextAreaInput.vue';
import WListInput from 'components/shared/widget-inputs/WListInput.vue';

import {
  CustomCommand,
  ChatbotPermissions,
  ChatbotResponseTypes,
} from 'services/chatbot/chatbot-interfaces';


import {
  IWListMetadata,
  IWTextMetadata,
} from 'components/shared/widget-inputs/WInput';

@Component({
  components: {
    WTextInput,
    WTextAreaInput,
    WListInput
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
  commandMetadata: IWTextMetadata = {
    required: true,
    placeholder: 'Enter the text string which will trigger the response'
  };
  responseMetadata: IWTextMetadata = {
    required: true,
    placeholder: 'The phrase that will appear after a user enters the command'
  };
  permissionMetadata: IWListMetadata<number> = {
    options: Object.keys(ChatbotPermissions).map(permission => {
      return {
        value: ChatbotPermissions[permission],
        title: permission
      };
    })
  };

  showToMetadata: IWListMetadata<string> = {
    options: ChatbotResponseTypes.map(responseType => {
      return {
        value: responseType,
        title: responseType
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
    this.chatbotApiService
      .createCustomCommand(this.newCommand)
      .then((response: CustomCommand) => {
      });
  }
}
