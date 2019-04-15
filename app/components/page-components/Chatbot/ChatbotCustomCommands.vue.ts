import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { ICustomCommand, DELETE_COMMAND_MODAL } from 'services/chatbot';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import ChatbotGenericModalWindow from './windows/ChatbotGenericModalWindow.vue';
import { EmptySection } from 'streamlabs-beaker';

@Component({
  components: {
    ChatbotPagination,
    ChatbotGenericModalWindow,
    EmptySection,
  },
})
export default class ChatbotDefaultCommands extends ChatbotBase {
  searchQuery = '';
  selectedCommand: ICustomCommand = null;

  get DELETE_COMMAND_MODAL() {
    return DELETE_COMMAND_MODAL;
  }

  get commands() {
    return this.chatbotApiService.Commands.state.customCommandsResponse.data;
  }

  get currentPage() {
    return this.chatbotApiService.Commands.state.customCommandsResponse.pagination.current;
  }

  get totalPages() {
    return this.chatbotApiService.Commands.state.customCommandsResponse.pagination.total;
  }

  mounted() {
    this.fetchCommands(1);
    this.chatbotApiService.Commands.fetchCommandPreferences();
  }

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchCommands(this.currentPage, value);
  }

  fetchCommands(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.Commands.fetchCustomCommands(page, query);
  }

  onOpenCommandWindowHandler(command?: ICustomCommand) {
    this.chatbotApiService.Common.openCustomCommandWindow(command);
  }

  onDeleteCommandHandler(command: ICustomCommand) {
    this.selectedCommand = command;
    this.chatbotApiService.Common.closeChatbotChildWindow();
    this.$modal.show(DELETE_COMMAND_MODAL);
  }

  onYesHandler() {
    if (this.selectedCommand) {
      this.chatbotApiService.Commands.deleteCustomCommand(this.selectedCommand.id);
    }
  }

  onNoHandler() {
    this.selectedCommand = null;
  }

  onToggleEnableCommandHandler(commandId: string, index: number, isEnabled: boolean) {
    const commandToBeUpdated = this.commands[index];

    this.chatbotApiService.Commands.updateCustomCommand(commandId, {
      ...commandToBeUpdated,
      enabled: isEnabled,
    });
  }

  onOpenCommandPreferencesHandler() {
    this.chatbotApiService.Common.openCommandPreferencesWindow();
  }
}
