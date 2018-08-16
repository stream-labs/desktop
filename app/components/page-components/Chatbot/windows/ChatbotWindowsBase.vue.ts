import Vue from 'vue';
import { Component, Inject } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ModalLayout from 'components/ModalLayout.vue';
import windowMixin from 'components/mixins/window';
import VModal from 'vue-js-modal';

Vue.use(VModal);

@Component({
  components: {
    ModalLayout,
  },
  mixins: [windowMixin]
})
export default class ChatbotWindowsBase extends ChatbotBase {

  // switching between 2 child windows, link protection and default command(to edit link protection command)
  toggleLinkProtectionWindow() {
    const currentWindow = this.chatbotCommonService.windowsService.getChildWindowOptions().componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotCommonService.openLinkProtectionWindow();
        break;
      case 'ChatbotLinkProtectionWindow':
        const linkProtectionPermitCommand =
          this.chatbotApiService.state.defaultCommandsResponse['link-protection'].permit;

        this.chatbotCommonService.openDefaultCommandWindow({
          ...linkProtectionPermitCommand,
          slugName: 'link-protection',
          commandName: 'permit'
        });
        break;
    }
  }
}
