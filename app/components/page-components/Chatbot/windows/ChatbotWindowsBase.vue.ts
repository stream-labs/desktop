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
    this.chatbotApiService.Common.closeChildWindow();
  }

  onSaveHandler(): void {}

  // switching between 2 child windows, link protection and default command(to edit link protection command)
  onToggleLinkProtectionWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openLinkProtectionWindow();
        break;
      case 'ChatbotLinkProtectionWindow':
        const linkProtectionPermitCommand = this.chatbotApiService.Commands.state
          .defaultCommandsResponse['link-protection'].permit;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...linkProtectionPermitCommand,
          slugName: 'link-protection',
          commandName: 'permit'
        });
        break;
    }
  }

  onToggleLoyaltyPreferencesWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openLoyaltyPreferencesWindow();
        break;
      case 'ChatbotLoyaltyPreferencesWindow':
        const loyaltyPointsCommand = this.chatbotApiService.Commands.state
          .defaultCommandsResponse['loyalty'].points;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...loyaltyPointsCommand,
          slugName: 'loyalty',
          commandName: 'points'
        });
        break;
    }
  }

  onToggleHeistPreferencesWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openLoyaltyPreferencesWindow();
        break;
      case 'ChatbotHeistPreferencesWindow':
        const loyaltyPointsCommand = this.chatbotApiService.Commands.state
          .defaultCommandsResponse['heist'].enter;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...loyaltyPointsCommand,
          slugName: 'heist',
          commandName: 'enter'
        });
        break;
    }
  }

  onToggleQuoteWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openQuotePreferencesWindow();
        break;
      case 'ChatbotQuotePreferencesWindow':
        const quotePreferencesCommand = this.chatbotApiService.Commands.state
          .defaultCommandsResponse['quotes'].get;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...quotePreferencesCommand,
          slugName: 'quotes',
          commandName: 'get'
        });
        break;
    }
  }

  onToggleQueueWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openQueuePreferencesWindow();
        break;
      case 'ChatbotQueuePreferencesWindow':
        const queuePreferencesCommand = this.chatbotApiService.Commands.state
          .defaultCommandsResponse['queue'].join;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...queuePreferencesCommand,
          slugName: 'queue',
          commandName: 'join'
        });
        break;
    }
  }

  onToggleSongRequestWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openSongRequestPreferencesWindow();
        break;
      case 'ChatbotSongRequestPreferencesWindow':
        const queuePreferencesCommand = this.chatbotApiService.Commands.state
          .defaultCommandsResponse['songrequest'].songrequest;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...queuePreferencesCommand,
          slugName: 'songrequest',
          commandName: 'songrequest'
        });
        break;
    }
  }
}
