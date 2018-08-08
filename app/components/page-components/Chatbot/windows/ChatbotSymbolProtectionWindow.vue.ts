import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';

@Component({})
export default class ChatbotSymbolProtectionWindow extends ChatbotModToolsBase {
  tabs: { name: string; value: string }[] = [
    {
      name: 'General',
      value: 'general'
    },
    {
      name: 'Advanced',
      value: 'advanced'
    }
  ];

  selectedTab: string = 'general';

  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onSave() {
    this.chatbotApiService
      .updateSymbolProtection({
        enabled: this.symbolProtectionResponse.enabled,
        settings: this.symbolProtection
      })
      .then(() => {
        this.chatbotCommonService.closeChildWindow();
      });
  }
}
