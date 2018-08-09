import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { ICustomCommand } from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {

  searchQuery = '';

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

  matchesQuery(command: ICustomCommand) {
    return (
      command.command.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
      command.response.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1
    )
  }

  openCommandWindow(command?: ICustomCommand) {
    this.chatbotCommonService.openCustomCommandWindow(command);
  }

  deleteCommand(command: ICustomCommand) {
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