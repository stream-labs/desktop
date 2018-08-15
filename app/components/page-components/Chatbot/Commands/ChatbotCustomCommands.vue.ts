import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { ICustomCommand } from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {

  query = '';

  timeOutFetchQuery: number = null;

  get commands() {
    return this.chatbotApiService.state.customCommandsResponse.data;
  }

  get currentPage() {
    return this.chatbotApiService.state.customCommandsResponse.pagination.current;
  }

  get totalPages() {
    return this.chatbotApiService.state.customCommandsResponse.pagination.total;
  }

  mounted() {
    this.fetchCommands(1);
  }

  get searchQuery() {
    return this.query;
  }

  set searchQuery(value: string) {
    this.query = value;
    window.clearTimeout(this.timeOutFetchQuery);
    this.timeOutFetchQuery = window.setTimeout(() => {
      this.fetchCommands(this.currentPage, value);
    }, 1000)
  }

  fetchCommands(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.fetchCustomCommands(page, query);
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