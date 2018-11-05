import { Component, Prop } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import ChatbotLinkProtectionList from 'components/page-components/Chatbot/windows/ChatbotLinkProtectionList.vue';
import { ITab } from 'components/Tabs.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: {
    ChatbotLinkProtectionList,
    ValidatedForm
  }
})
export default class ChatbotLinkProtectionWindow extends ChatbotModToolsBase {
  $refs: {
    form: ValidatedForm;
  };

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

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  onResetHandler() {
    this.onResetSlugHandler('link-protection');
  }

  async onSaveHandler() {
    if (this.$refs.form && await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService
      .ModTools
      .updateLinkProtection({
        enabled: this.linkProtectionResponse.enabled,
        settings: this.linkProtection
      })
      .then(() => {
        this.chatbotApiService.Common.closeChildWindow();
      });
  }
}
