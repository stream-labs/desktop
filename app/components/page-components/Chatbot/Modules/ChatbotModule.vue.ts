import { Component, Prop } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { IChatbotModule } from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotModule extends ChatbotBase {
  @Prop() chatbotModule: IChatbotModule;

  mounted() {
    console.log(this.chatbotModule);
  }

  // get chatAlerts() {
  //   return this.chatbotApiService.state.chat_alerts_response.settings;
  // }

  // get chatAlertsEnabled() {
  //   return this.chatbotApiService.state.chat_alerts_response.enabled === 1;
  // }

  // mounted() {
  //   this.chatbotApiService.fetchChatAlerts();
  // }
}
