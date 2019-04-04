import { Component, Watch } from 'vue-property-decorator';
import ChatbotModToolsBase from 'components/page-components/Chatbot/module-bases/ChatbotModToolsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotParagraphProtectionWindow extends ChatbotModToolsBase {
  $refs: {
    form: ValidatedForm;
  };

  modToolSlug = 'paragraph-protection';

  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general',
    },
    {
      name: $t('Advanced'),
      value: 'advanced',
    },
  ];

  selectedTab: string = 'general';

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  onResetHandler() {
    this.onResetSlugHandler('paragraph-protection');
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.ModTools.updateParagraphProtection({
      enabled: this.paragraphProtectionResponse.enabled,
      settings: this.paragraphProtection,
    }).then(() => {
      this.chatbotApiService.Common.closeChildWindow();
    });
  }
}
