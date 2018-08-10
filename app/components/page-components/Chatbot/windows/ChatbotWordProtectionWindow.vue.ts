import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import ChatbotWordProtectionList from 'components/page-components/Chatbot/windows/ChatbotWordProtectionList.vue';
import { ITab } from 'components/Tabs.vue';

@Component({
  components: {
    ChatbotWordProtectionList
  }
})
export default class ChatbotWordProtectionWindow extends ChatbotModToolsBase {
  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general'
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

  onSave() {
    this.chatbotApiService
      .updateWordProtection({
        enabled: this.wordProtectionResponse.enabled,
        settings: this.wordProtection
      })
      .then(() => {
        this.chatbotCommonService.closeChildWindow();
      });
  }
}
