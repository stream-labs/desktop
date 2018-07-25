import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';

import {
  IChatbotModule,
  ChatAlertsResponse
} from 'services/chatbot/chatbot-interfaces';

@Component({
  components: {
    ChatbotModule
  }
})
export default class ChatbotModules extends ChatbotBase {

  mounted() {
    this.chatbotApiService.fetchChatAlerts();
  }

  get modules() {
    let modules: IChatbotModule[] = [
      {
        title: 'Chat Alerts',
        description: 'Get notified in chat whenever an activity happens like Donations and Subscribers.',
        window: 'ChatbotAlertsWindow',
        enabled: this.chatAlertsEnabled,
        onToggleEnabled: () => {
          // toggle chatbot alerts
          // this.doSomething(!this.chatAlertsEnabled);
        }
      }
    ];
    return modules;
  }

  get chatAlertsEnabled() {
    return this.chatbotApiService.state.chat_alerts_response.enabled === 1;
  }



}
