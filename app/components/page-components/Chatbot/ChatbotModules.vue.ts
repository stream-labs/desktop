import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';

@Component({
})
export default class ChatbotModules extends ChatbotBase {
  get chatAlerts() {
    return this.chatbotApiService.state.chat_alerts_response.settings;
  }

  get enabled() {
    return this.chatbotApiService.state.chat_alerts_response.enabled === 1;
  }

  mounted() {
    this.chatbotApiService.fetchChatAlerts();
  }
}
