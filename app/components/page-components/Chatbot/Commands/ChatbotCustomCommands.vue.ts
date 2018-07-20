import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import {
  CustomCommandsResponse,
  CustomCommandsData,
  Pagination
} from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {
  commands: CustomCommandsData = [];
  pagination: Pagination = {
    current: 1,
    total: 1
  };

  mounted() {
    //
    // get list of user's custom commands
    //
    this.fetchCommands(this.pagination.current);
  }

  fetchCommands(page: number) {
    // fetch custom commands
    this.chatbotApiService
      .fetchCustomCommands(page)
      .then((response: CustomCommandsResponse) => {
        this.commands = response.data;
        this.pagination = response.pagination;
      });
  }

  openCreateCommandWindow() {
    this.chatbotCommonService.openCreateCommandWindow();
  }

  toggleEnableCommand(commandName: string, isEnabled: number) {}
}
