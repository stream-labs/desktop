import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { IPollProfile } from 'services/chatbot';
import ChatbotPollProfile from './Poll/ChatbotPollProfile.vue';
import ChatbotVoteTracker from './Poll/ChatbotVoteTracker.vue';
import ChatbotActivePoll from './Poll/ChatbotActivePoll.vue';

@Component({
  components: {
    ChatbotPollProfile,
    ChatbotVoteTracker,
    ChatbotActivePoll,
  },
})
export default class ChatbotPoll extends ChatbotBase {
  async mounted() {
    await this.chatbotApiService.Base.logInToSocket(['poll']);
    await this.chatbotApiService.Poll.fetchPollPreferences();
    await this.chatbotApiService.Poll.fetchActivePoll();

    this.chatbotApiService.Poll.connectSocket();
  }

  destroyed() {
    this.chatbotApiService.Poll.disconnectSocket();
  }

  get profiles() {
    return this.chatbotApiService.Poll.state.pollPreferencesResponse.settings.profiles;
  }

  onOpenProfileHandler(profile: IPollProfile) {
    this.chatbotApiService.Common.openPollProfileWindow(profile);
  }

  onOpenPollPreferencesHandler() {
    this.chatbotApiService.Common.openPollPreferencesWindow();
  }

  get isPollActive() {
    return (
      this.chatbotApiService.Poll.state.activePollResponse &&
      this.chatbotApiService.Poll.state.activePollResponse.id &&
      this.chatbotApiService.Poll.state.activeView === 'active'
    );
  }
}
