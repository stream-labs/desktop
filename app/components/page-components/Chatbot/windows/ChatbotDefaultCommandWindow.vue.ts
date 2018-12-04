import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { ITab } from 'components/Tabs.vue';
import { IDefaultCommand } from 'services/chatbot';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import {
  IListMetadata,
  ITextMetadata,
  EInputType
} from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';

@Component({
  components: {
    ChatbotAliases,
    ValidatedForm
  }
})
export default class ChatbotDefaultCommandWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  editedCommand: IDefaultCommand = null;

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
    this.editedCommand = cloneDeep(this.defaultCommandToUpdate);
  }

  get isLinkProtectionPermitCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'link-protection' &&
      this.defaultCommandToUpdate.commandName === 'permit'
    );
  }

  get isQuoteCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'quotes' &&
      this.defaultCommandToUpdate.commandName === 'get'
    );
  }

  get isQueueJoinCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'queue' &&
      this.defaultCommandToUpdate.commandName === 'join'
    );
  }

  get isSongRequestCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'songrequest' &&
      this.defaultCommandToUpdate.commandName === 'songrequest'
    );
  }

  get isLoyaltyCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'loyalty' &&
      this.defaultCommandToUpdate.commandName === 'points'
    );
  }

  get defaultCommandToUpdate() {
    return this.chatbotApiService.Common.state.defaultCommandToUpdate;
  }

  // metadata
  get metadata() {
    return {
      command: metadataHelper.text({
        required: true,
        type: EInputType.text,
        placeholder: $t(
          'Enter the text string which will trigger the response'
        ),
        tooltip: $t('Enter a word used to trigger a response'),
        max: 450,
        uuid: $t('Command')
      }),
      response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear after a user enters the command'
        ),
        max: 450,
        uuid: $t('Response')
      }),
      new_alias: metadataHelper.text({
        required: true,
        type: EInputType.text,
        placeholder: $t('Add a new command alias'),
        max: 450,
        uuid: $t('Alias')
      }),
      success_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear after a successful command'
        ),
        max: 450,
        uuid: $t('Success Response')
      }),
      failed_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a failed command'),
        max: 450,
        uuid: $t('Failed Response')
      }),
      enabled_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear after a command is enabled'
        ),
        max: 450,
        uuid: $t('Enabled Response')
      }),
      disabled_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear after a command is disabled'
        ),
        max: 450,
        uuid: $t('Disabled Response')
      }),
      duration_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          "The phrase that will appear when a song's duration is too long"
        ),
        max: 450,
        uuid: $t('Duration Response')
      }),
      rating_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          "The phrase that will appear when a song's rating is too low"
        ),
        max: 450,
        uuid: $t('Rating Response')
      }),
      views_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          "The phrase that will appear when a song's view count is too low"
        ),
        max: 450,
        uuid: $t('Views Response')
      }),
      banned_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear when the user requested a banned song'
        ),
        max: 450,
        uuid: $t('Banned Response')
      }),
      music_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear when the song is not in the music category'
        ),
        max: 450,
        uuid: $t('Music Response')
      }),
      max_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear when the user already maxed their request limit'
        ),
        max: 450,
        uuid: $t('Max Response')
      }),
      full_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear if your song queue is currently full'
        ),
        max: 450,
        uuid: $t('Full Response')
      }),
      response_type: this.responseTypeMetadata
    };
  }

  get responseTypeMetadata() {
    let responseTypeMetadata: IListMetadata<string> = {
      type: EInputType.list,
      options: this.chatbotResponseTypes
    };
    return responseTypeMetadata;
  }

  @Watch('editedCommand', { immediate: true, deep: true })
  @debounce(1)
  onCommandChanged(value: IDefaultCommand, oldValue: IDefaultCommand) {
    if (oldValue) {
      this.editedCommand.command = value.command.replace(/ +/g, '');

      for (const key in this.editedCommand) {
        if (this.editedCommand.hasOwnProperty(key) && key.includes('response')) {
          this.editedCommand[key] =  value[key].replace(/(\r\n|\r|\n)/g, '');
        }
      }
    }
  }

  // methods
  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  async onResetCommandHandler() {
    const { slugName, commandName } = this.defaultCommandToUpdate;
    const resettedCommand = await this.chatbotApiService.Commands.resetDefaultCommand(
      slugName,
      commandName
    );
    this.editedCommand = cloneDeep({
      ...resettedCommand,
      slugName,
      commandName
    });
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Commands.updateDefaultCommand(
      this.defaultCommandToUpdate.slugName,
      this.defaultCommandToUpdate.commandName,
      this.editedCommand
    );
  }
}
