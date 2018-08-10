import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { cloneDeep } from 'lodash';
import { ITab } from 'components/Tabs.vue';

import {
  ICustomCommand,
} from 'services/chatbot/chatbot-interfaces';

import {
  IListMetadata,
  ITextMetadata,
  INumberMetadata
} from 'components/shared/inputs/index';

@Component({
  components: {
    ChatbotAliases
  }
})
export default class ChatbotCustomCommandWindow extends ChatbotWindowsBase {
  newCommand: ICustomCommand = {
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

  tabs: ITab[] = [
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

  mounted() {
    // if editing existing custom command
    if (this.isEdit) {
      this.newCommand = cloneDeep(this.customCommandToUpdate);
    }
  }

  get isEdit() {
    return this.customCommandToUpdate && this.customCommandToUpdate.id;
  }

  get customCommandToUpdate() {
    return this.chatbotCommonService.state.customCommandToUpdate;
  }

  get permissionMetadata() {
    let permissionMetadata: IListMetadata<number> = {
      options: this.chatbotPermissions
    };
    return permissionMetadata;
  }

  get replyTypeMetadata() {
    let replyTypeMetadata: IListMetadata<string> = {
      options: this.chatbotResponseTypes
    };
    return replyTypeMetadata;
  }

  get cooldownsMetadata() {
    let timerMetadata: INumberMetadata = {
      placeholder: 'cooldown in minutes',
      min: 0
    };
    return timerMetadata;
  }

  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    if (this.isEdit) {
      this.chatbotApiService.updateCustomCommand(
        this.customCommandToUpdate.id,
        this.newCommand
      );
      return;
    }

    this.chatbotApiService.createCustomCommand(this.newCommand);
  }
}
