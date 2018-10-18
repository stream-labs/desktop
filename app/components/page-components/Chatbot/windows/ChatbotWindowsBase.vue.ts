import Vue from 'vue';
import { Component, Inject } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ModalLayout from 'components/ModalLayout.vue';


import VModal from 'vue-js-modal';

Vue.use(VModal);

@Component({
  components: {
    ModalLayout
  }
})
export default class ChatbotWindowsBase extends ChatbotBase {
  onCancelHandler(): void {
    this.chatbotCommonService.closeChildWindow();
  }

  onSaveHandler(): void {}

  // switching between 2 child windows, link protection and default command(to edit link protection command)
  onToggleLinkProtectionWindowHandler() {
    const currentWindow = this.chatbotCommonService.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotCommonService.openLinkProtectionWindow();
        break;
      case 'ChatbotLinkProtectionWindow':
        const linkProtectionPermitCommand = this.chatbotApiService.state
          .defaultCommandsResponse['link-protection'].permit;

        this.chatbotCommonService.openDefaultCommandWindow({
          ...linkProtectionPermitCommand,
          slugName: 'link-protection',
          commandName: 'permit'
        });
        break;
    }
  }

  onToggleQuoteWindowHandler() {
    const currentWindow = this.chatbotCommonService.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotCommonService.openQuotePreferencesWindow();
        break;
      case 'ChatbotQuotePreferencesWindow':
        const quotePreferencesCommand = this.chatbotApiService.state
          .defaultCommandsResponse['quotes'].get;

        this.chatbotCommonService.openDefaultCommandWindow({
          ...quotePreferencesCommand,
          slugName: 'quotes',
          commandName: 'get'
        });
        break;
    }
  }

  onToggleQueueWindowHandler() {
    const currentWindow = this.chatbotCommonService.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotCommonService.openQueuePreferencesWindow();
        break;
      case 'ChatbotQueuePreferencesWindow':
        const queuePreferencesCommand = this.chatbotApiService.state
          .defaultCommandsResponse['queue'].join;

        this.chatbotCommonService.openDefaultCommandWindow({
          ...queuePreferencesCommand,
          slugName: 'queue',
          commandName: 'join'
        });
        break;
    }
  }

  onToggleSongRequestWindowHandler() {
    const currentWindow = this.chatbotCommonService.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotCommonService.openSongRequestPreferencesWindow();
        break;
      case 'ChatbotSongRequestPreferencesWindow':
        const queuePreferencesCommand = this.chatbotApiService.state
          .defaultCommandsResponse['songrequest'].songrequest;

        this.chatbotCommonService.openDefaultCommandWindow({
          ...queuePreferencesCommand,
          slugName: 'songrequest',
          commandName: 'songrequest'
        });
        break;
    }
  }
}
