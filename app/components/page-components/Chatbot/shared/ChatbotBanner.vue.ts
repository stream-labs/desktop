import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';
import electron from 'electron';
@Component({
  components: {
    ChatbotModule,
  },
})
export default class ChatbotBanner extends ChatbotBase {
  onCloseBannerHandler() {
    this.chatbotApiService.Common.hideModBanner();
  }

  get modBannerVisible() {
    return this.chatbotApiService.Common.state.modBannerVisible;
  }

  get isYoutube() {
    return this.chatbotApiService.Base.userService.platform.type === 'youtube';
  }

  openCommunitySettings() {
    electron.remote.shell.openExternal('https://www.youtube.com/comment_management');
  }
}
