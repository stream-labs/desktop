import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Watch } from 'vue-property-decorator';
import { IChatbotTimer } from 'services/chatbot';
import { Debounce } from 'lodash-decorators';
import ChatbotPagination from 'components/page-components/Chatbot/shared/ChatbotPagination.vue';

@Component({
  components: {
    ChatbotPagination,
  },
})
export default class ChatbotTimers extends ChatbotBase {
  searchQuery = '';

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

  @Watch('searchQuery')
  @Debounce(1000)
  onQueryChangeHandler(value: string) {
    this.fetchTimers(this.currentPage, value);
  }

  fetchTimers(page: number = this.currentPage, query?: string) {
    this.chatbotApiService.fetchTimers(page, query);
  }

  onOpenTimerWindowHandler(timer?: IChatbotTimer) {
    this.chatbotCommonService.openTimerWindow(timer);
  }

  onToggleEnableTimerHandler(timerId: string, index: number, isEnabled: boolean) {
    const timerToBeUpdated = this.timers[index];

    this.chatbotApiService.updateTimer(timerId, {
      ...timerToBeUpdated,
      enabled: isEnabled,
    });
  }

  onDeleteTimerHandler(timer?: IChatbotTimer) {
    this.chatbotApiService.deleteTimer(timer.id);
  }
}
