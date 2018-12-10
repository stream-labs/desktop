import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { IQueuePreferencesGeneralSettings } from 'services/chatbot';

import {
  EInputType
} from 'components/shared/inputs/index';
import { debounce } from 'lodash-decorators';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({})
export default class ChatbotQueuePreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  generalSettings: IQueuePreferencesGeneralSettings = {
    maximum: 0,
    messages: {
      picked: ''
    }
  };

  // metadata
  get metadata() {
    return {
      maximum: metadataHelper.number({
        required: true,
        type: EInputType.number,
        placeholder: $t('Maximum Queue Size'),
        min: 1,
        max: 1000
      }),
      messages: {
        picked: metadataHelper.text({
          required: true,
          type: EInputType.textArea,
          placeholder: $t('Message when user is picked.')
        }),
        max: 450
      }
    };
  }

  get queuePreferences() {
    return this.chatbotApiService.Queue.state.queuePreferencesResponse;
  }

  mounted() {
    // if editing existing custom command
    this.generalSettings = cloneDeep(this.queuePreferences.settings.general);
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged(){
    await this.$refs.form.validateAndGetErrorsCount()
  }

  onSaveHandler() {
    const newPreferences = cloneDeep(this.queuePreferences);
    newPreferences.settings.general = this.generalSettings;
    this.chatbotApiService.Queue.updateQueuePreferences(newPreferences);
  }
}
