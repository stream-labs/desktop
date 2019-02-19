import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { IHeistPreferencesResponse, IPollPreferencesResonse } from 'services/chatbot';

import { EInputType } from 'components/shared/inputs/index';
import { ITab } from 'components/Tabs.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotPollPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newPollPreferences: IPollPreferencesResonse = {
    settings: {
      commands: {},
      general: {
        repeat_active: {
          chat_lines: 25,
          enabled: false,
          message: null,
        },
      },
      messages: {
        cancel: null,
        close: null,
        open: null,
        results: {
          tie: null,
          win: null,
        },
      },
      profiles: null,
    },
    enabled: false,
  };

  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general',
    },
    {
      name: $t('Messages'),
      value: 'messages',
    },
  ];

  selectedTab: string = 'general';

  // metadata
  get metaData() {
    return {
      repeat: {
        required: true,
        type: EInputType.textArea,
        min: 1,
        max: 450,
        placeholder: $t('Repeat Message'),
        uuid: $t('Repeat Message'),
      },
      tie: {
        required: true,
        type: EInputType.textArea,
        min: 1,
        max: 450,
        placeholder: $t('Tie Message'),
        uuid: $t('Tie Message'),
        blockReturn: true,
      },
      win: {
        required: true,
        type: EInputType.textArea,
        min: 1,
        max: 450,
        placeholder: $t('Win Message'),
        uuid: $t('Win Message'),
        blockReturn: true,
      },
      open: {
        required: true,
        type: EInputType.textArea,
        min: 1,
        max: 450,
        placeholder: $t('Open Message'),
        uuid: $t('Open Message'),
        blockReturn: true,
      },
      close: {
        required: true,
        type: EInputType.textArea,
        min: 1,
        max: 450,
        placeholder: $t('Close Message'),
        uuid: $t('Close Message'),
        blockReturn: true,
      },
      cancel: {
        required: true,
        type: EInputType.textArea,
        min: 1,
        max: 450,
        placeholder: $t('Cancel Message'),
        uuid: $t('Cancel Message'),
        blockReturn: true,
      },
      chatLines: {
        required: true,
        type: EInputType.slider,
        min: 5,
        max: 100,
        tooltip: $t('Amount of chat lines before the bot repeats the message.'),
        isInteger: true,
      },
    };
  }

  get pollPreferences() {
    return this.chatbotApiService.Poll.state.pollPreferencesResponse;
  }

  mounted() {
    this.newPollPreferences = _.cloneDeep(this.pollPreferences);
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onResetHandler() {
    await this.chatbotApiService.Poll.resetSettings().then(response => {
      this.newPollPreferences = response;
    });

    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Poll.updatePollPreferences(this.newPollPreferences);
  }
}
