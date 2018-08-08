import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import { cloneDeep } from 'lodash';
import ChatbotAliases from 'components/page-components/Chatbot/shared/ChatbotAliases.vue';

import {
  IDefaultCommand,
} from 'services/chatbot/chatbot-interfaces';


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
    TextInput,
    TextAreaInput,
    ListInput,
    ChatbotAliases
  }
})
export default class ChatbotDefaultCommandWindow extends ChatbotWindowsBase {
  editedCommand: IDefaultCommand = null;

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

  mounted() {
    this.editedCommand = cloneDeep(this.defaultCommandToUpdate);
    console.log(this.editedCommand);
  }

  get defaultCommandToUpdate() {
    return this.chatbotCommonService.state.defaultCommandToUpdate;
  }

  // metadata
  get metadata() {
    let metadata: IDefaultCommandMetadata = {
      command: this.stringMetadata(
        'Enter the text string which will trigger the response'
      ),
      response: this.stringMetadata(
        'The phrase that will appear after a user enters the command'
      ),
      new_alias: this.stringMetadata('Add a new command alias'),
      success_response: this.stringMetadata(
        'The phrase that will appear after a successful command'
      ),
      failed_response: this.stringMetadata(
        'The phrase that will appear after a failed command'
      ),
      enabled_response: this.stringMetadata(
        'The phrase that will appear after a command is enabled'
      ),
      disabled_response: this.stringMetadata(
        'The phrase that will appear after a command is disabled'
      ),
      response_type: this.responseTypeMetadata
    };
    return metadata;
  }

  stringMetadata(placeholder?: string) {
    return {
      required: true,
      placeholder
    };
  }

  get responseTypeMetadata() {
    let responseTypeMetadata: IListMetadata<string> = {
      options: this.chatbotResponseTypes
    };
    return responseTypeMetadata;
  }

  // methods
  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    this.chatbotApiService.updateDefaultCommand(
      this.defaultCommandToUpdate.slugName,
      this.defaultCommandToUpdate.commandName,
      this.editedCommand
    );
  }
}
