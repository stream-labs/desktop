import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
import { ChatbotSettingSlugs } from 'services/chatbot/chatbot-interfaces';

@Component({})
export default class ChatbotSymbolProtectionWindow extends ChatbotModToolsBase {
  modToolSlug = 'symbol-protection';
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

  onReset() {
  this.onResetSlug(ChatbotSettingSlugs['symbol-protection']);
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
