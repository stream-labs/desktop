import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { IGamblePreferencesResponse } from 'services/chatbot';

import { EInputType, metadata, formMetadata } from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotGamblePreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newGamblePreferences: IGamblePreferencesResponse = {
    settings: {
      commands: {},
      general: {
        min: 10,
        max: 10000,
        range: {
          '1-25': 0,
          '26-50': 0,
          '51-75': 1.25,
          '76-98': 2,
          '99-100': 3,
        },
      },
    },
    enabled: false,
  };

  // metadata
  get metaData() {
    return formMetadata({
      min: metadata.number({
        required: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isInteger: true,
      }),
      max: metadata.number({
        required: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isInteger: true,
      }),
      range1: metadata.number({
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
      range2: metadata.number({
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
      range3: metadata.number({
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
      range4: metadata.number({
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
      range5: metadata.number({
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
    });
  }

  get gamblePreferences() {
    return this.chatbotApiService.Gamble.state.gamblePreferencesResponse;
  }

  mounted() {
    this.newGamblePreferences = _.cloneDeep(this.gamblePreferences);
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Gamble.updateGamblePreferences(this.newGamblePreferences);
  }
}
