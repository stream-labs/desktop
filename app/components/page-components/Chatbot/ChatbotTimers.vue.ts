import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component, Prop } from 'vue-property-decorator';
import {
  TimersResponse,
  TimersData,
  Pagination,
  ChatbotAPIPutResponse
} from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotTimers extends ChatbotBase {
  timers: TimersData = [];
  pagination: Pagination = {
    current: 1,
    total: 1
  };

  mounted() {
    // get list of timers
    this.fetchTimers(this.pagination.current);
  }

  fetchTimers(page: number) {
    // fetch timers
    this.chatbotApiService
      .fetchTimers(page)
      .then((response: TimersResponse) => {
        this.timers = response.data;
        this.pagination = response.pagination;
      });
  }

  openTimerWindow() {
    this.chatbotCommonService.openTimerWindow();
  }

  toggleEnabletimer(timerId: string, index: number, isEnabled: boolean) {
    const timerToBeUpdated = this.timers[index];

    this.chatbotApiService
      .updateTimer(timerId, {
        ...timerToBeUpdated,
        enabled: isEnabled
      })
      .then((response: ChatbotAPIPutResponse) => {
        if (response.success) {
          this.timers[index].enabled = isEnabled;
        }
      });
  }
}
