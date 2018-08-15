import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { ITimer } from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotTimers extends ChatbotBase {
  query = '';
  timeOutFetchQuery: number = null;

  get timers() {
    return this.chatbotApiService.state.timersResponse.data;
  }

  get currentPage() {
    return this.chatbotApiService.state.timersResponse.pagination.current;
  }

  get totalPages() {
    return this.chatbotApiService.state.timersResponse.pagination.total;
  }

  mounted() {
    // get list of timers
    this.fetchTimers(1);
  }

  get searchQuery() {
    return this.query;
  }

  set searchQuery(value: string) {
    this.query = value;
    window.clearTimeout(this.timeOutFetchQuery);
    this.timeOutFetchQuery = window.setTimeout(() => {
      this.fetchTimers(this.currentPage, value);
    }, 1000);
  }

  fetchTimers(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.fetchTimers(page, query);
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
