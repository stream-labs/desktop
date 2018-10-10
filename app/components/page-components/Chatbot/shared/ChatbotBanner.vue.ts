import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ChatbotModule from 'components/page-components/Chatbot/Modules/ChatbotModule.vue';

@Component({
  components: {
    ChatbotModule
  }
})
export default class ChatbotBanner extends ChatbotBase {
  onCloseBannerHandler() {
    this.chatbotApiService.Common.hideModBanner();
  }

  get modBannerVisible() {
    return this.chatbotApiService.Common.state.modBannerVisible;
  }
}
