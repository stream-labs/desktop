import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import cloneDeep from 'lodash/cloneDeep';
import { ITab } from 'components/Tabs.vue';
import { IDefaultCommand } from 'services/chatbot';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { IListMetadata, EInputType } from 'components/shared/inputs';
import { debounce } from 'lodash-decorators';

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

  get isLoyaltyCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'loyalty' &&
      this.defaultCommandToUpdate.commandName === 'points'
    );
  }

  get isHeistCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'heist' &&
      this.defaultCommandToUpdate.commandName === 'enter'
    );
  }

  get isPollCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'poll' &&
      this.defaultCommandToUpdate.commandName === 'vote'
    );
  }

  get isBetCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'betting' &&
      this.defaultCommandToUpdate.commandName === 'bet'
    );
  }

  get isGambleCommand() {
    return (
      this.defaultCommandToUpdate.slugName === 'gamble' &&
      this.defaultCommandToUpdate.commandName === 'gamble'
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
        placeholder: $t('Enter the text string which will trigger the response'),
        tooltip: $t('Enter a word used to trigger a response'),
        max: 450,
        min: 2,
        uuid: $t('Command'),
      }),
      response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a user enters the command'),
        max: 450,
        uuid: $t('Response'),
      }),
      replyType: metadataHelper.list({
        required: true,
        title: $t('Reply In'),
        type: EInputType.list,
        options: this.chatbotResponseTypes,
      }),
      permission: metadataHelper.numberList({
        required: true,
        title: $t('Permission'),
        type: EInputType.list,
        options: this.chatbotPermissions,
      }),
      new_alias: metadataHelper.text({
        required: true,
        type: EInputType.text,
        placeholder: $t('Add a new command alias'),
        max: 450,
        uuid: $t('Alias'),
      }),
      win_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after the viewer wins'),
        max: 450,
        uuid: $t('Win Response'),
        blockReturn: true,
      }),
      lose_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after the viewer loses'),
        max: 450,
        uuid: $t('Lose Response'),
        blockReturn: true,
      }),
      success_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a successful command'),
        max: 450,
        uuid: $t('Success Response'),
        blockReturn: true,
      }),
      failed_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a failed command'),
        max: 450,
        uuid: $t('Failed Response'),
        blockReturn: true,
      }),
      enabled_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a command is enabled'),
        max: 450,
        uuid: $t('Enabled Response'),
        blockReturn: true,
      }),
      disabled_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear after a command is disabled'),
        max: 450,
        uuid: $t('Disabled Response'),
        blockReturn: true,
      }),
      duration_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t("The phrase that will appear when a song's duration is too long"),
        max: 450,
        uuid: $t('Duration Response'),
        blockReturn: true,
      }),
      rating_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t("The phrase that will appear when a song's rating is too low"),
        max: 450,
        uuid: $t('Rating Response'),
        blockReturn: true,
      }),
      views_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t("The phrase that will appear when a song's view count is too low"),
        max: 450,
        uuid: $t('Views Response'),
        blockReturn: true,
      }),
      banned_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear when the user requested a banned song'),
        max: 450,
        uuid: $t('Banned Response'),
        blockReturn: true,
      }),
      music_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear when the song is not in the music category'),
        max: 450,
        uuid: $t('Music Response'),
        blockReturn: true,
      }),
      max_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t(
          'The phrase that will appear when the user already maxed their request limit',
        ),
        max: 450,
        uuid: $t('Max Response'),
        blockReturn: true,
      }),
      full_response: metadataHelper.text({
        required: true,
        type: EInputType.textArea,
        placeholder: $t('The phrase that will appear if your song queue is currently full'),
        max: 450,
        uuid: $t('Full Response'),
        blockReturn: true,
      }),
      cooldown: metadataHelper.number({
        title: $t('Cooldown'),
        placeholder: $t('Cooldown'),
        tooltip: $t('Value in seconds'),
        min: 0,
        max: 86400,
        isInteger: true,
      }),
      usercooldown: metadataHelper.number({
        title: $t('User Cooldown'),
        placeholder: $t('User Cooldown'),
        tooltip: $t('Value in seconds'),
        min: 0,
        max: 86400,
        isInteger: true,
      }),
      response_type: this.responseTypeMetadata,
    };
  }

  get responseTypeMetadata() {
    const responseTypeMetadata: IListMetadata<string> = {
      type: EInputType.list,
      options: this.chatbotResponseTypes,
    };
    return responseTypeMetadata;
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  // methods
  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  async onResetCommandHandler() {
    const { slugName, commandName } = this.defaultCommandToUpdate;
    const resettedCommand = await this.chatbotApiService.Commands.resetDefaultCommand(
      slugName,
      commandName,
    );
    this.editedCommand = cloneDeep({
      ...resettedCommand,
      slugName,
      commandName,
    });
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Commands.updateDefaultCommand(
      this.defaultCommandToUpdate.slugName,
      this.defaultCommandToUpdate.commandName,
      this.editedCommand,
    );
  }
}
