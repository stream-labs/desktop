import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import ChatbotLinkProtectionList from 'components/page-components/Chatbot/windows/ChatbotLinkProtectionList.vue';

@Component({
  components: {
    ChatbotLinkProtectionList
  }
})
export default class ChatbotLinkProtectionWindow extends ChatbotModToolsBase {
  tabs: { name: string; value: string }[] = [
    {
      name: 'General',
      value: 'general'
    },
    {
      name: 'Whitelist',
      value: 'whitelist'
    },
    {
      name: 'Blacklist',
      value: 'blacklist'
    }
  ];

  selectedTab: string = 'general';

  onSelectTab(tab: string) {
    this.selectedTab = tab;
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
