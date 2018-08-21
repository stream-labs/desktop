import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { ITab } from 'components/Tabs.vue';
import { IDefaultCommand } from 'services/chatbot/chatbot-interfaces';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { $t } from 'services/i18n';

import {
  IListMetadata,
  ITextMetadata,
} from 'components/shared/inputs/index';


interface IDefaultCommandMetadata {
  command: ITextMetadata;
  response: ITextMetadata;
  new_alias: ITextMetadata;
  success_response: ITextMetadata;
  failed_response: ITextMetadata;
  enabled_response: ITextMetadata;
  disabled_response: ITextMetadata;
  response_type: IListMetadata<string>;
}


@Component({
  components: {
    ChatbotAliases
  }
})
export default class ChatbotDefaultCommandWindow extends ChatbotWindowsBase {
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

  get defaultCommandToUpdate() {
    return this.chatbotCommonService.state.defaultCommandToUpdate;
  }

  // metadata
  get metadata() {
    let metadata: IDefaultCommandMetadata = {
      command: metadataHelper.text({
        required: true,
        placeholder: $t(
          'Enter the text string which will trigger the response'
        ),
        tooltip: $t('Enter a word used to trigger a response')
      }),
      response: metadataHelper.text({
        required: true,
        placeholder: $t(
          'The phrase that will appear after a user enters the command'
        )
      }),
      new_alias: metadataHelper.text({
        required: true,
        placeholder: $t('Add a new command alias')
      }),
      success_response: metadataHelper.text({
        required: true,
        placeholder: $t(
          'The phrase that will appear after a successful command'
        )
      }),
      failed_response: metadataHelper.text({
        required: true,
        placeholder: $t('The phrase that will appear after a failed command')
      }),
      enabled_response: metadataHelper.text({
        required: true,
        placeholder: $t(
          'The phrase that will appear after a command is enabled'
        )
      }),
      disabled_response: metadataHelper.text({
        required: true,
        placeholder: $t(
          'The phrase that will appear after a command is disabled'
        )
      }),
      response_type: this.responseTypeMetadata
    };
    return metadata;
  }

  get responseTypeMetadata() {
    let responseTypeMetadata: IListMetadata<string> = {
      options: this.chatbotResponseTypes
    };
    return responseTypeMetadata;
  }

  // methods
  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  onCancelHandler() {
    this.chatbotCommonService.closeChildWindow();
  }

  async onResetCommandHandler() {
    const { slugName, commandName } = this.defaultCommandToUpdate;
    const resettedCommand = await this.chatbotApiService.resetDefaultCommand(
      slugName,
      commandName
    );
    this.editedCommand = cloneDeep({
      ...resettedCommand,
      slugName,
      commandName
    });
  }

  onSave() {
    this.chatbotApiService.updateDefaultCommand(
      this.defaultCommandToUpdate.slugName,
      this.defaultCommandToUpdate.commandName,
      this.editedCommand
    );
  }
}
