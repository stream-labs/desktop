import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { IBettingPreferencesResponse } from 'services/chatbot';

import { EInputType, metadata, formMetadata } from 'components/shared/inputs/index';
import { ITab } from 'components/Tabs.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotBettingPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newBettingPreferences: IBettingPreferencesResponse = {
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
        win: null,
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
    return formMetadata({
      repeat: metadata.textArea({
        required: true,
        min: 1,
        max: 450,
        placeholder: $t('Repeat Message'),
      }),
      win: metadata.textArea({
        required: true,
        min: 1,
        max: 450,
        placeholder: $t('Win Message'),
        blockReturn: false,
      }),
      open: metadata.textArea({
        required: true,
        min: 1,
        max: 450,
        placeholder: $t('Open Message'),
        blockReturn: false,
      }),
      close: metadata.textArea({
        required: true,
        min: 1,
        max: 450,
        placeholder: $t('Close Message'),
        blockReturn: false,
      }),
      cancel: metadata.textArea({
        required: true,
        min: 1,
        max: 450,
        placeholder: $t('Cancel Message'),
        uuid: $t('Cancel Message'),
        blockReturn: false,
      }),
      chatLines: metadata.slider({
        required: true,
        min: 5,
        max: 100,
        tooltip: $t('Amount of chat lines before the bot repeats the message.'),
      }),
    });
  }

  get pollPreferences() {
    return this.chatbotApiService.Betting.state.bettingPreferencesResponse;
  }

  mounted() {
    this.newBettingPreferences = _.cloneDeep(this.pollPreferences);
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
    await this.chatbotApiService.Betting.resetSettings().then(response => {
      this.newBettingPreferences = response;
    });

    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Betting.updatePreferences(this.newBettingPreferences);
  }
}
