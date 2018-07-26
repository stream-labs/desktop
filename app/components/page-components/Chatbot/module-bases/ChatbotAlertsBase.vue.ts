import { Component, Prop } from 'vue-property-decorator';
// import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';

@Component({})
export default class ChatbotAlertsBase extends ChatbotWindowsBase {
  get chatAlerts() {
    return this.chatbotApiService.state.chat_alerts_response;
  }

  get chatAlertsEnabled() {
    return this.chatbotApiService.state.chat_alerts_response.enabled;
  }

}
