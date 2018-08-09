import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
@Component({})
export default class ChatbotCapsProtectionWindow extends ChatbotModToolsBase {
  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general'
    },
    {
      name: $t('Advanced'),
      value: 'advanced'
    }
  ];

  selectedTab: string = 'general';

  onSelectTab(tab: string) {
    this.selectedTab = tab;
  }

  onSave() {
    this.chatbotApiService
      .updateCapsProtection({
        enabled: this.capsProtectionResponse.enabled,
        settings: this.capsProtection
      })
      .then(() => {
        this.chatbotCommonService.closeChildWindow();
      });
  }
}
