import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';

@Component({})
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
        this.chatbotCommonService.showToast($t('Saved successfully'), {
          duration: 3000,
          position: 'top-right',
          className: 'toast-success'
        });
      });
  }
}
