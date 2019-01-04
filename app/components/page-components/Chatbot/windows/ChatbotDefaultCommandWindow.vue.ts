import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { ITab } from 'components/Tabs.vue';
import { IDefaultCommand } from 'services/chatbot';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { EInputType, IListMetadata } from 'components/shared/inputs';

@Component({
  components: {
    ChatbotAliases,
    ValidatedForm,
  },
})
export default class ChatbotDefaultCommandWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  editedCommand: IDefaultCommand = null;

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

  get defaultCommandToUpdate() {
    return this.chatbotCommonService.state.defaultCommandToUpdate;
  }

  // metadata
  get metadata() {
    return {
      command: metadataHelper.text({
        required: true,
        type: EInputType.text,
        placeholder: $t('Enter the text string which will trigger the response'),
        tooltip: $t('Enter a word used to trigger a response'),
      }),
      response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a user enters the command'),
      }),
      new_alias: metadataHelper.text({
        required: true,
        type: EInputType.text,
        placeholder: $t('Add a new command alias'),
      }),
      success_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a successful command'),
      }),
      failed_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a failed command'),
      }),
      enabled_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a command is enabled'),
      }),
      disabled_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a command is disabled'),
      }),
      duration_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t("The phrase that will appear when a song's duration is too long"),
      }),
      rating_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t("The phrase that will appear when a song's rating is too low"),
      }),
      views_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t("The phrase that will appear when a song's view count is too low"),
      }),
      banned_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear when the user requested a banned song'),
      }),
      music_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear when the song is not in the music category'),
      }),
      max_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear when the user already maxed their request limit',
        ),
      }),
      full_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear if your song queue is currently full'),
      }),
      response_type: this.responseTypeMetadata,
    };
  }

  get responseTypeMetadata(): IListMetadata<string> {
    return {
      type: EInputType.list,
      options: this.chatbotResponseTypes,
    };
  }

  // methods
  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  async onResetCommandHandler() {
    const { slugName, commandName } = this.defaultCommandToUpdate;
    const resettedCommand = await this.chatbotApiService.resetDefaultCommand(slugName, commandName);
    this.editedCommand = cloneDeep({
      ...resettedCommand,
      slugName,
      commandName,
    });
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.updateDefaultCommand(
      this.defaultCommandToUpdate.slugName,
      this.defaultCommandToUpdate.commandName,
      this.editedCommand,
    );
  }
}
