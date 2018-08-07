import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import {
  ITimersResponse,
  ITimersData,
  ITimer,
  IPagination,
  IChatbotAPIPutResponse
} from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotTimers extends ChatbotBase {
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
