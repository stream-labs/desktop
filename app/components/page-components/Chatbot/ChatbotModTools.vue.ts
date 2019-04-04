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
export default class ChatbotModTools extends ChatbotBase {
  mounted() {
    this.chatbotApiService.ModTools.fetchEmoteProtection();
    this.chatbotApiService.ModTools.fetchParagraphProtection();
    this.chatbotApiService.ModTools.fetchCapsProtection();
    this.chatbotApiService.ModTools.fetchSymbolProtection();
    this.chatbotApiService.ModTools.fetchLinkProtection();
    this.chatbotApiService.ModTools.fetchWordProtection();
  }

  get modules(): IChatbotModule[] {
    const backgroundUrlSuffix = this.nightMode ? 'night' : 'day';
    return [
      {
        title: $t('Caps Protection'),
        description: $t('Restrict viewers from spamming all caps messages to chat.'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-caps--${backgroundUrlSuffix}.png`),
        enabled: this.capsProtectionCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openCapsProtectionWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.ModTools.updateCapsProtection({
            ...this.capsProtection,
            enabled: !this.capsProtectionCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Symbol Protection'),
        description: $t('Restrict viewers from spamming messages with too many symbols.'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-symbol--${backgroundUrlSuffix}.png`),
        enabled: this.symbolProtectionCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openSymbolProtectionWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.ModTools.updateSymbolProtection({
            ...this.symbolProtection,
            enabled: !this.symbolProtectionCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Link Protection'),
        description: $t(
          'Allows a viewer to only send links to chat from websites on the whitelist.',
        ),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-link--${backgroundUrlSuffix}.png`),
        enabled: this.linkProtectionCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openLinkProtectionWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.ModTools.updateLinkProtection({
            ...this.linkProtection,
            enabled: !this.linkProtectionCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Word Protection'),
        description: $t('Restrict words from appearing on chat and add words to your blacklist.'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-word--${backgroundUrlSuffix}.png`),
        enabled: this.wordProtectionCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openWordProtectionWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.ModTools.updateWordProtection({
            ...this.wordProtection,
            enabled: !this.wordProtectionCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Emote Protection'),
        description: $t('Removes messages containing excessive an amount of emotes.'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-word--${backgroundUrlSuffix}.png`),
        enabled: this.emoteProtectionCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openEmoteProtectionWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.ModTools.updateEmoteProtection({
            ...this.emoteProtection,
            enabled: !this.emoteProtectionCurrentlyEnabled,
          });
        },
      },
      {
        title: $t('Paragraph Protection'),
        description: $t('Prevents viewers from sending overly lengthy messages.'),
        backgroundUrl: require(`../../../../media/images/chatbot/chatbot-word--${backgroundUrlSuffix}.png`),
        enabled: this.parargaphProtectionCurrentlyEnabled,
        onExpand: () => {
          this.chatbotApiService.Common.openParagraphProtectionWindow();
        },
        onToggleEnabled: () => {
          this.chatbotApiService.ModTools.updateParagraphProtection({
            ...this.paragraphProtection,
            enabled: !this.parargaphProtectionCurrentlyEnabled,
          });
        },
      },
    ];
  }

  get capsProtection() {
    return this.chatbotApiService.ModTools.state.capsProtectionResponse;
  }

  get symbolProtection() {
    return this.chatbotApiService.ModTools.state.symbolProtectionResponse;
  }

  get linkProtection() {
    return this.chatbotApiService.ModTools.state.linkProtectionResponse;
  }

  get wordProtection() {
    return this.chatbotApiService.ModTools.state.wordProtectionResponse;
  }

  get emoteProtection() {
    return this.chatbotApiService.ModTools.state.emoteProtectionResponse;
  }

  get paragraphProtection() {
    return this.chatbotApiService.ModTools.state.paragraphProtectionResponse;
  }

  get capsProtectionCurrentlyEnabled() {
    return this.capsProtection.enabled === true;
  }

  get symbolProtectionCurrentlyEnabled() {
    return this.symbolProtection.enabled === true;
  }

  get linkProtectionCurrentlyEnabled() {
    return this.linkProtection.enabled === true;
  }

  get wordProtectionCurrentlyEnabled() {
    return this.wordProtection.enabled === true;
  }

  get emoteProtectionCurrentlyEnabled() {
    return this.emoteProtection.enabled === true;
  }

  get parargaphProtectionCurrentlyEnabled() {
    return this.paragraphProtection.enabled === true;
  }
}
