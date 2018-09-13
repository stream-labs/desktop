import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';
import { $t } from 'services/i18n';

import {
  IChatbotModule,
} from 'services/chatbot';

@Component({
  components: {
    ChatbotModule
  }
})
export default class ChatbotModules extends ChatbotBase {

  mounted() {
    this.chatbotApiService.fetchChatAlerts();
    this.chatbotApiService.fetchSongRequest();
  }

  get modules() {
    const backgroundUrlSuffix = this.nightMode ? 'night' : 'day';
    const comingSoonText = $t(
      'Streamlabs is diligently working on the next release of Chatbot. Stay tuned. We have more features on the way.'
    );
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
      },
      {
        title: $t('Song Request'),
        description: $t('Request songs!!'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-alert--${backgroundUrlSuffix}.png`),
        enabled: this.songRequestCurrentlyEnabled,
        onExpand: () => {
          this.chatbotCommonService.openSongRequestWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.updateSongRequest({
            ...this.songRequest,
            enabled: !this.songRequestCurrentlyEnabled
          });
          // if (!this.songRequestCurrentlyEnabled) {
          //   // enabling, show onboarding
          //   this.chatbotCommonService.openSongRequestOnboardingWindow();
          // }
        },
      },
      {
        title: $t('Mini Games'),
        description: comingSoonText,
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-construction--${backgroundUrlSuffix}.svg`),
        enabled: false,
        onExpand: () => { },
        onToggleEnabled: () => { },
        comingSoon: true
      },
      {
        title: $t('Counter'),
        description: comingSoonText,
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-construction--${backgroundUrlSuffix}.svg`),
        enabled: false,
        onExpand: () => { },
        onToggleEnabled: () => { },
        comingSoon: true
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

  get songRequest() {
    return this.chatbotApiService.state.songRequestResponse;
  }

  get songRequestCurrentlyEnabled() {
    return this.chatbotApiService.state.songRequestResponse.enabled === true;
  }
}
