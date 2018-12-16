import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';
import ChatbotQueueList from 'components/page-components/Chatbot/Queue/ChatbotQueueList.vue';

@Component({
  components: {
    ChatbotPagination,
    ChatbotQueueList
  }
})
export default class ChatbotQueue extends ChatbotBase {
  queueTitle = 'The Current Game';

  $refs: {
    entrylist: ChatbotQueueList;
  };

  async mounted() {
    await this.chatbotApiService.Base.logInToSocket(['queue']);
    await this.chatbotApiService.Queue.fetchQueueState();

    if (!this.chatbotApiService.Queue.isConnected()) {
      this.chatbotApiService.Queue.fetchQueueEntries();
      this.chatbotApiService.Queue.fetchQueuePicked();
    }

    this.chatbotApiService.Queue.connectSocket();

    this.chatbotApiService.Queue.fetchQueuePreferences();

    this.queueTitle = this.chatbotApiService.Queue.state.queueStateResponse.title;
  }

  destroyed() {
    this.chatbotApiService.Queue.disconnectSocket();
  }

  get noUsersInList() {
    return (
      this.chatbotApiService.Queue.state.queueEntriesResponse.data.length === 0
    );
  }

  onOpenQueuePreferencesHandler() {
    this.chatbotApiService.Common.openQueuePreferencesWindow();
  }

  onToggleQueueOpenHandler() {
    if (this.queueIsOpen) {
      this.chatbotApiService.Queue.closeQueue();
      return;
    }

    if (!this.queueTitle) return;
    this.chatbotApiService.Queue.openQueue(this.queueTitle);
  }

  onPickRandomEntryHandler() {
    this.chatbotApiService.Queue.pickQueueEntryRandom().then(() => {
      this.$refs.entrylist.loadNewEntries();
    });
  }

  get queueIsOpen() {
    return (
      this.chatbotApiService.Queue.state.queueStateResponse.status === 'Open'
    );
  }
}
