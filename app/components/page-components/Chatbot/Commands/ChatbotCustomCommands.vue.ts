import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import {
  ICustomCommandsResponse,
  ICustomCommandsData,
  IPagination,
  IChatbotAPIPutResponse,
  ICustomCommand
} from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {
  get commands() {
    return this.chatbotApiService.state.customCommandsResponse.data;
  }

  get currentPage() {
    return this.chatbotApiService.state.customCommandsResponse.pagination
      .current;
  }

  mounted() {
    this.chatbotApiService.fetchCustomCommands(this.currentPage);
  }

  openCommandWindow(command?: ICustomCommand) {
    this.chatbotCommonService.openCustomCommandWindow(command);
  }

  deleteCommand(command?: ICustomCommand) {
    this.chatbotApiService.deleteCustomCommand(command.id);
  }

  toggleEnableCommand(commandId: string, index: number, isEnabled: boolean) {
    const commandToBeUpdated = this.commands[index];

    this.chatbotApiService.updateCustomCommand(commandId, {
      ...commandToBeUpdated,
      enabled: isEnabled
    });
  }
}