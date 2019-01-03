import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { IGamblePreferencesResponse } from 'services/chatbot';

import { EInputType } from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm }
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
          '99-100': 3
        }
      }
    },
    enabled: false
  };

  // metadata
  get metaData() {
    return {
      min: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        placeholder: $t('Min Amount')
      },
      max: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        placeholder: $t('Max Amount')
      },
      range1: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('1-25')
      },
      range2: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('26-50')
      },
      range3: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('51-75')
      },
      range4: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('76-98')
      },
      range5: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('99-100')
      }
    };
  }

  get gamblePreferences() {
    return this.chatbotApiService.Gamble.state.gamblePreferencesResponse;
  }

  mounted() {
    this.newGamblePreferences = cloneDeep(this.gamblePreferences);
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Gamble.updateGamblePreferences(
      this.newGamblePreferences
    );
  }
}
