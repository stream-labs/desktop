import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { ITimer } from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotTimers extends ChatbotBase {

  searchQuery = '';

  get timers() {
    return this.chatbotApiService.state.timersResponse.data;
  }

  get currentPage() {
    return this.chatbotApiService.state.timersResponse.pagination.current;
  }

  mounted() {
    // get list of timers
    this.chatbotApiService.fetchTimers(this.currentPage);
  }

  matchesQuery(timer: ITimer) {
    return (
      timer.name.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
      timer.message.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1
    )
  }

  openTimerWindow(timer?: ITimer) {
    this.chatbotCommonService.openTimerWindow(timer);
  }

  toggleEnableTimer(timerId: string, index: number, isEnabled: boolean) {
    const timerToBeUpdated = this.timers[index];

    this.chatbotApiService.updateTimer(timerId, {
      ...timerToBeUpdated,
      enabled: isEnabled
    });
  }

  deleteTimer(timer?: ITimer) {
    this.chatbotApiService.deleteTimer(timer.id);
  }
}
