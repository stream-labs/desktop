import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import {
  CustomCommandsResponse,
  CustomCommandsData,
  Pagination,
  ChatbotAPIPutResponse
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

  openCommandWindow() {
    this.chatbotCommonService.openCommandWindow();
  }

  toggleEnableCommand(commandId: string, index: number, isEnabled: boolean) {
    const commandToBeUpdated = this.commands[index];

    this.chatbotApiService
      .updateCustomCommand(commandId, {
        ...commandToBeUpdated,
        enabled: isEnabled
      })
      .then((response: ChatbotAPIPutResponse) => {
        if (response.success) {
          this.commands[index].enabled = isEnabled;
        }
      });
  }
}
