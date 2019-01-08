import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { cloneDeep } from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { ITab } from 'components/Tabs.vue';
import { $t } from 'services/i18n';

import { IChatbotErrorResponse, ICustomCommand } from 'services/chatbot';

import {
  EInputType,
  IListMetadata,
  INumberMetadata,
  ITextMetadata,
} from 'components/shared/inputs';

@Component({
  components: {
    ChatbotAliases,
    ValidatedForm,
  },
})
export default class ChatbotCustomCommandWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newCommand: ICustomCommand = {
    command: null,
    response: null,
    response_type: 'Chat',
    permission: {
      level: 1,
      info: {},
    },
    cooldowns: {
      global: 0,
      user: 0,
    },
    aliases: [],
    platforms: 7,
    enabled: true,
  };

  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general',
    },
    {
      name: $t('Advanced'),
      value: 'advanced',
    },
  ];

  selectedTab: string = 'general';

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

  // metadata
  commandMetadata: ITextMetadata = {
    required: true,
    type: EInputType.text,
    placeholder: $t('Enter the text string which will trigger the response'),
    tooltip: $t('Enter a word used to trigger a response'),
  };
  responseMetadata: ITextMetadata = {
    required: true,
    type: EInputType.textArea,
    placeholder: $t('The phrase that will appear after a user enters the command'),
  };

  get permissionMetadata(): IListMetadata<number> {
    return {
      required: true,
      type: EInputType.list,
      options: this.chatbotPermissions,
    };
  }

  get replyTypeMetadata(): IListMetadata<string> {
    return {
      required: true,
      type: EInputType.list,
      options: this.chatbotResponseTypes,
    };
  }

  get cooldownsMetadata(): INumberMetadata {
    return {
      type: EInputType.number,
      placeholder: $t('Cooldown (Value in Seconds)'),
      min: 0,
    };
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    if (this.isEdit) {
      this.chatbotApiService
        .updateCustomCommand(this.customCommandToUpdate.id, this.newCommand)
        .catch(this.onErrorHandler);
      return;
    }

    this.chatbotApiService.createCustomCommand(this.newCommand).catch(this.onErrorHandler);
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This command is already taken. Try another command.'));
    }
  }
}
