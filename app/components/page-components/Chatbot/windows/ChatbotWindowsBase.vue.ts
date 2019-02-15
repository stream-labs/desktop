import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import ModalLayout from 'components/ModalLayout.vue';

import VModal from 'vue-js-modal';

Vue.use(VModal);

@Component({
  components: {
    ModalLayout,
  },
})
export default class ChatbotWindowsBase extends ChatbotBase {
  onCancelHandler(): void {
    this.chatbotApiService.Common.closeChildWindow();
  }

  onSaveHandler(): void {}

  get isTwitch() {
    return this.chatbotApiService.Base.userService.platform.type === 'twitch';
  }

  get isMixer() {
    return this.chatbotApiService.Base.userService.platform.type === 'mixer';
  }

  get isYoutube() {
    return this.chatbotApiService.Base.userService.platform.type === 'youtube';
  }

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
          commandName: 'permit',
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
        const loyaltyPointsCommand = this.chatbotApiService.Commands.state.defaultCommandsResponse[
          'loyalty'
        ].points;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...loyaltyPointsCommand,
          slugName: 'loyalty',
          commandName: 'points',
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
        const loyaltyPointsCommand = this.chatbotApiService.Commands.state.defaultCommandsResponse[
          'heist'
        ].enter;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...loyaltyPointsCommand,
          slugName: 'heist',
          commandName: 'enter',
        });
        break;
    }
  }

  onTogglePollPreferencesWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openPollPreferencesWindow();
        break;
      case 'ChatbotPollPreferencesWindow':
        const pollVoteCommand = this.chatbotApiService.Commands.state.defaultCommandsResponse[
          'poll'
        ].vote;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...pollVoteCommand,
          slugName: 'poll',
          commandName: 'vote',
        });
        break;
    }
  }

  onToggleBettingPreferencesWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openBettingPreferencesWindow();
        break;
      case 'ChatbotBettingPreferencesWindow':
        const betCommand = this.chatbotApiService.Commands.state.defaultCommandsResponse['betting']
          .bet;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...betCommand,
          slugName: 'betting',
          commandName: 'bet',
        });
        break;
    }
  }

  onToggleGamblePreferencesWindowHandler() {
    const currentWindow = this.chatbotApiService.Common.windowsService.getChildWindowOptions()
      .componentName;

    switch (currentWindow) {
      case 'ChatbotDefaultCommandWindow':
        this.chatbotApiService.Common.openGamblePreferencesWindow();
        break;
      case 'ChatbotGamblePreferencesWindow':
        const gambleCommand = this.chatbotApiService.Commands.state.defaultCommandsResponse[
          'gamble'
        ].gamble;

        this.chatbotApiService.Common.openDefaultCommandWindow({
          ...gambleCommand,
          slugName: 'gamble',
          commandName: 'gamble',
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
          commandName: 'get',
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
          commandName: 'join',
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
          commandName: 'songrequest',
        });
        break;
    }
  }
}
