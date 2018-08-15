import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { ICustomCommand } from 'services/chatbot/chatbot-interfaces';
import { Debounce } from 'lodash-decorators';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {
  searchQuery = '';

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

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchCommands(this.currentPage, value);
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