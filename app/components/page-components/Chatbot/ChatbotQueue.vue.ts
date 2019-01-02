import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import ChatbotQueueList from 'components/page-components/Chatbot/Queue/ChatbotQueueList.vue';

@Component({
  components: {
    ChatbotPagination,
    ChatbotQueueList,
  },
})
export default class ChatbotQueue extends ChatbotBase {
  queueTitle = 'The Current Game';

  async mounted() {
    await this.chatbotApiService.logInToSocket(['queue']);
    await this.chatbotApiService.fetchQueueState();

    this.chatbotApiService.connectToQueueSocketChannels();
    this.chatbotApiService.fetchQueueEntries();
    this.chatbotApiService.fetchQueuePicked();
    this.chatbotApiService.fetchQueuePreferences();

    this.queueTitle = this.chatbotApiService.state.queueStateResponse.title;
  }

  get noUsersInList() {
    return this.chatbotApiService.state.queueEntriesResponse.data.length === 0;
  }

  onOpenQueuePreferencesHandler() {
    this.chatbotCommonService.openQueuePreferencesWindow();
  }

  onToggleQueueOpenHandler() {
    if (this.queueIsOpen) {
      this.chatbotApiService.closeQueue();
      return;
    }

    if (!this.queueTitle) return;
    this.chatbotApiService.openQueue(this.queueTitle);
  }

  onPickRandomEntryHandler() {
    this.chatbotApiService.pickQueueEntryRandom();
  }

  get queueIsOpen() {
    return this.chatbotApiService.state.queueStateResponse.status === 'Open';
  }
}
