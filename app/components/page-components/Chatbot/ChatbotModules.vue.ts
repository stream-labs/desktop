import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';

import {
  IChatbotModule,
  IChatAlertsResponse
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
        backgroundUrl: 'media/images/chatbot/chatbot-alert.png',
        enabled: this.chatAlertCurrentlyEnabled,
        onExpand: () => {
          this.chatbotCommonService.openChatbotAlertsWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.updateChatAlerts({
            ...this.chatAlerts,
            enabled: !this.chatAlertCurrentlyEnabled
          });
        }
      }
    ];
    return modules;
  }

  get chatAlerts() {
    return this.chatbotApiService.state.chatAlertsResponse;
  }

  get chatAlertCurrentlyEnabled() {
    return this.chatbotApiService.state.chatAlertsResponse.enabled == true;
  }
}
