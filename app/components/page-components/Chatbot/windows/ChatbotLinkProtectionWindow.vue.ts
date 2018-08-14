import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import ChatbotLinkProtectionList from 'components/page-components/Chatbot/windows/ChatbotLinkProtectionList.vue';
import { ITab } from 'components/Tabs.vue';
import { ChatbotSettingSlugs } from 'services/chatbot/chatbot-interfaces';

@Component({
  components: {
    ChatbotLinkProtectionList
  }
})
export default class ChatbotLinkProtectionWindow extends ChatbotModToolsBase {
  modToolSlug = 'link-protection';
  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general'
    },
    {
      name: $t('Whitelist'),
      value: 'whitelist'
    },
    {
      name: $t('Blacklist'),
      value: 'blacklist'
    }
  ];

  selectedTab: string = 'general';

  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onReset() {
    this.onResetSlug(ChatbotSettingSlugs['link-protection']);
  }

  onSave() {
    this.chatbotApiService
      .updateLinkProtection({
        enabled: this.linkProtectionResponse.enabled,
        settings: this.linkProtection
      })
      .then(() => {
        this.chatbotCommonService.closeChildWindow();
      });
  }
}
