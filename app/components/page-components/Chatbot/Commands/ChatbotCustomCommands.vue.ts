import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import {
  ICustomCommandsResponse,
  ICustomCommandsData,
  IPagination,
  IChatbotAPIPutResponse
} from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {

  get commands() {
    return this.chatbotApiService.state.custom_commands_response.data;
  }

  get currentPage() {
    return this.chatbotApiService.state.custom_commands_response.pagination.current;
  }

  mounted() {
    //
    // get list of user's custom commands
    //
    this.chatbotApiService.fetchCustomCommands(this.currentPage);
  }

  openCommandWindow() {
    this.chatbotCommonService.openCommandWindow();
  }

  toggleEnableCommand(commandId: string, index: number, isEnabled: boolean) {
    const commandToBeUpdated = this.commands[index];

    this.chatbotApiService
      .updateCustomCommand(commandId, {
        ...commandToBeUpdated,
        enabled: isEnabled
      });
  }
}
