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
  waitlistTitle = '';

  async mounted() {
    await this.chatbotApiService.logInToSocket(['queue']);
    await this.chatbotApiService.fetchQueueState();

    this.chatbotApiService.connectToQueueSocketChannels();
    this.chatbotApiService.fetchQueueEntries();
    this.chatbotApiService.fetchQueuePicked();

    this.waitlistTitle = this.chatbotApiService.state.queueStateResponse.title;
  }

  onToggleQueueOpenHandler() {
    if (this.queueIsOpen) {
      this.chatbotApiService.closeQueue();
      return;
    }

    if (!this.waitlistTitle) return;
    this.chatbotApiService.openQueue(this.waitlistTitle);
  }

  onPickRandomEntryHandler() {
    this.chatbotApiService.pickQueueEntryRandom();
  }

  get queueIsOpen() {
    return this.chatbotApiService.state.queueStateResponse.status === 'Open';
  }
}
