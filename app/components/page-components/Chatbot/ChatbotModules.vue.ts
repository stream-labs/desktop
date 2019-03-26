import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';
import { $t } from 'services/i18n';

import { IChatbotModule } from 'services/chatbot';

@Component({
  components: {
    ChatbotModule,
  },
})
export default class ChatbotModules extends ChatbotBase {
  mounted() {
    this.chatbotApiService.Commands.fetchDefaultCommands();
    this.chatbotApiService.Alerts.fetchChatAlerts();
    this.chatbotApiService.MediaRequest.fetchSongRequest();
    this.chatbotApiService.Heist.fetchHeistPreferences();
    this.chatbotApiService.Gamble.fetchGamblePreferences();
  }

  get modules(): IChatbotModule[] {
    const backgroundUrlSuffix = this.nightMode ? 'night' : 'day';
    const comingSoonText = $t(
      'Streamlabs is diligently working on the next release of Chatbot. Stay tuned. We have more features on the way.',
    );
    return [
      {
        title: $t('Chat Alerts'),
        description: $t(
          'Get notified in chat whenever an activity happens like Donations and Subscribers.',
        ),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-alert--${backgroundUrlSuffix}.png`),
        enabled: this.chatAlertCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openChatbotAlertsWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.Alerts.updateChatAlerts({
            ...this.chatAlerts,
            enabled: !this.chatAlertCurrentlyEnabled,
          });
        },
      },
      //  TODO: Commented for the time being seeing as it's not ready
      {
        title: $t('Media Share'),
        description: $t(
          'Allow your viewers to interact with your Media Share widget via Cloud Chatbot.',
        ),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-mediashare--${backgroundUrlSuffix}.png`),
        enabled: this.mediaRequestCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openMediaRequestPreferencesWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.MediaRequest.updateSongRequest({
            ...this.songRequest,
            enabled: !this.mediaRequestCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Heist'),
        description: $t(
          'Allow your viewers to work together and go on an adventure to earn extra loyalty points.',
        ),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-heist--${backgroundUrlSuffix}.png`),
        enabled: this.heistCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openHeistPreferencesWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.Heist.updateHeistPreferences({
            ...this.heist,
            enabled: !this.heistCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Gamble'),
        description: $t(
          'Allow your viewers to gamble with their loyalty points by rolling a 100 sided die.',
        ),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-gamble--${backgroundUrlSuffix}.png`),
        enabled: this.gambleCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openGamblePreferencesWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.Gamble.updateGamblePreferences({
            ...this.gamble,
            enabled: !this.gambleCurrentlyEnabled,
          });
        },
      },
    ];
  }

  get chatAlerts() {
    return this.chatbotApiService.Alerts.state.chatAlertsResponse;
  }

  get chatAlertCurrentlyEnabled() {
    return this.chatbotApiService.Alerts.state.chatAlertsResponse.enabled;
  }

  get songRequest() {
    return this.chatbotApiService.MediaRequest.state.mediaRequestResponse;
  }

  get mediaRequestCurrentlyEnabled() {
    return this.chatbotApiService.MediaRequest.state.mediaRequestResponse.enabled;
  }

  get heist() {
    return this.chatbotApiService.Heist.state.heistPreferencesResponse;
  }

  get gamble() {
    return this.chatbotApiService.Gamble.state.gamblePreferencesResponse;
  }

  get heistCurrentlyEnabled() {
    return this.chatbotApiService.Heist.state.heistPreferencesResponse.enabled;
  }

  get gambleCurrentlyEnabled() {
    return this.chatbotApiService.Gamble.state.gamblePreferencesResponse.enabled;
  }
}
