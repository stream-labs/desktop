import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { IBettingProfile } from 'services/chatbot';
import ChatbotPollProfile from './Poll/ChatbotPollProfile.vue';
import ChatbotActivePoll from './Poll/ChatbotActivePoll.vue';

@Component({
  components: {
    ChatbotPollProfile,
    ChatbotActivePoll,
  },
})
export default class ChatbotBetting extends ChatbotBase {
  async mounted() {
    await this.chatbotApiService.Base.logInToSocket(['betting']);
    await this.chatbotApiService.Betting.fetchPreferences();
    await this.chatbotApiService.Betting.fetchActive();

    this.chatbotApiService.Betting.connectSocket();
  }

  destroyed() {
    this.chatbotApiService.Betting.disconnectSocket();
  }

  get profiles() {
    return this.chatbotApiService.Betting.state.bettingPreferencesResponse.settings.profiles;
  }

  onOpenProfileHandler(profile: IBettingProfile) {
    this.chatbotApiService.Common.openBettingProfileWindow(profile);
  }

  onOpenBettingPreferencesHandler() {
    this.chatbotApiService.Common.openBettingPreferencesWindow();
  }

  get isPollActive() {
    return (
      this.chatbotApiService.Betting.state.activeBettingResponse &&
      this.chatbotApiService.Betting.state.activeBettingResponse.id &&
      this.chatbotApiService.Betting.state.activeView === 'active'
    );
  }
}
