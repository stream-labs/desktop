import { Component, Watch, Vue } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { cloneDeep } from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { ITab } from 'components/Tabs.vue';
import { $t } from 'services/i18n';

import { ICustomCommand, IChatbotErrorResponse } from 'services/chatbot';

import {
  EInputType,
  IListMetadata,
  ITextMetadata,
  INumberMetadata
} from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';

@Component({
  components: {
    ChatbotAliases,
    ValidatedForm
  }
})
export default class ChatbotCustomCommandWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newCommand: ICustomCommand = {
    command: '',
    response: '',
    response_type: 'Chat',
    permission: {
      level: 1,
      info: {}
    },
    cost:{
      base: 0
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
      name: $t('General'),
      value: 'general'
    },
    {
      name: $t('Advanced'),
      value: 'advanced'
    }
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
    return this.chatbotApiService.Common.state.customCommandToUpdate;
  }

  @Watch('newCommand', { immediate: true, deep: true })
  @debounce(1)
  onCommandChanged(value: ICustomCommand, oldValue: ICustomCommand) {
    if (oldValue) {
      this.newCommand.command = value.command.replace(/ +/g, '');
      this.newCommand.response = value.response.replace(/(\r\n|\r|\n)/g, '');
    }
  }

  // metadata
  commandMetadata: ITextMetadata = {
    required: true,
    type: EInputType.text,
    title: $t('Command'),
    placeholder: $t('Enter the text string which will trigger the response'),
    tooltip: $t('Enter a word used to trigger a response'),
    min: 2,
    max: 25,
    uuid: $t('Command')
  };
  responseMetadata: ITextMetadata = {
    required: true,
    title: $t('Response'),
    type: EInputType.textArea,
    placeholder: $t(
      'The phrase that will appear after a user enters the command'
    ),
    max: 450,
    uuid: $t('Response')
  };

  get permissionMetadata() {
    let permissionMetadata: IListMetadata<number> = {
      required: true,
      title: $t('Permission'),
      type: EInputType.list,
      options: this.chatbotPermissions
    };
    return permissionMetadata;
  }

  get replyTypeMetadata() {
    let replyTypeMetadata: IListMetadata<string> = {
      required: true,
      title: $t('Reply In'),
      type: EInputType.list,
      options: this.chatbotResponseTypes
    };
    return replyTypeMetadata;
  }

  get cooldownsMetadata() {
    let timerMetadata: INumberMetadata = {
      type: EInputType.number,
      title: $t('Cooldown'),
      placeholder: $t('Cooldown'),
      tooltip: $t('Value in seconds'),
      min: 0
    };
    return timerMetadata;
  }

  get costMetaData() {
    let timerMetadata: INumberMetadata = {
      type: EInputType.number,
      title: $t('Cost'),
      placeholder: $t('Cost'),
      min: 0,
      max: 1000000
    };
    return timerMetadata;
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged(){
    await this.$refs.form.validateAndGetErrorsCount()
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    if (this.isEdit) {
      this.chatbotApiService.Commands.updateCustomCommand(
        this.customCommandToUpdate.id,
        this.newCommand
      ).catch(this.onErrorHandler);
      return;
    }

    this.chatbotApiService.Commands.createCustomCommand(this.newCommand).catch(
      this.onErrorHandler
    );
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This command is already taken. Try another command.'));
    }
  }
}
