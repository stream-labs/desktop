import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';


@Component({})
export default class ChatbotCapsProtectionWindow extends ChatbotModToolsBase {
  modToolSlug = 'caps-protection';

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

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  onResetHandler() {
    this.onResetSlugHandler('caps-protection');
  }

  onSaveHandler() {
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
