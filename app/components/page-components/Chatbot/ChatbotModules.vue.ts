import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';
import { $t } from 'services/i18n';

import {
  IChatbotModule,
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
    const backgroundUrlSuffix = this.nightTheme ? 'night' : 'day';
    let modules: IChatbotModule[] = [
      {
        title: $t('Chat Alerts'),
        description: $t('Get notified in chat whenever an activity happens like Donations and Subscribers.'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-alert--${backgroundUrlSuffix}.png`),
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
