import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { cloneDeep } from 'lodash';
import { ITab } from 'components/Tabs.vue';
import { $t } from 'services/i18n';

import {
  ICustomCommand,
  IChatbotErrorResponse
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
      level: 1,
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
    placeholder: $t('Enter the text string which will trigger the response')
  };
  responseMetadata: ITextMetadata = {
    required: true,
    placeholder: $t(
      'The phrase that will appear after a user enters the command'
    )
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
      required: true,
      options: this.chatbotPermissions
    };
    return permissionMetadata;
  }

  get replyTypeMetadata() {
    let replyTypeMetadata: IListMetadata<string> = {
      required: true,
      options: this.chatbotResponseTypes
    };
    return replyTypeMetadata;
  }

  get cooldownsMetadata() {
    let timerMetadata: INumberMetadata = {
      placeholder: $t('Cooldown (Value in Minutes)'),
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
      this.chatbotApiService
        .updateCustomCommand(this.customCommandToUpdate.id, this.newCommand)
        .catch(this.onErrorHandler);
      return;
    }

    this.chatbotApiService
      .createCustomCommand(this.newCommand)
      .catch(this.onErrorHandler);
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert('This command is already taken. Try another command.');
    }
  }
}
