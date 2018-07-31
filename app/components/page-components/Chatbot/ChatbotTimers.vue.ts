import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import {
  ITimersResponse,
  ITimersData,
  IPagination,
  IChatbotAPIPutResponse
} from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotTimers extends ChatbotBase {
  get timers() {
    return this.chatbotApiService.state.timers_response.data;
  }

  get currentPage() {
    return this.chatbotApiService.state.timers_response.pagination.current;
  }

  mounted() {
    // get list of timers
    this.chatbotApiService.fetchTimers(this.currentPage);
  }

  openTimerWindow() {
    this.chatbotCommonService.openTimerWindow();
  }

  toggleEnableTimer(timerId: string, index: number, isEnabled: boolean) {
    const timerToBeUpdated = this.timers[index];

    this.chatbotApiService.updateTimer(timerId, {
      ...timerToBeUpdated,
      enabled: isEnabled
    });
  }
}
