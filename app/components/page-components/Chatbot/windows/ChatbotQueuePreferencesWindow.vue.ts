import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { IQueuePreferencesGeneralSettings } from 'services/chatbot';

import {
  EInputType
} from 'components/shared/inputs/index';

@Component({})
export default class ChatbotQueuePreferencesWindow extends ChatbotWindowsBase {
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
        placeholder: $t('Maximum Queue Size')
      }),
      messages: {
        picked: metadataHelper.text({
          required: true,
          type: EInputType.textArea,
          placeholder: $t('Message when user is picked.')
        })
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

  onSaveHandler() {
    const newPreferences = cloneDeep(this.queuePreferences);
    newPreferences.settings.general = this.generalSettings;
    this.chatbotApiService.Queue.updateQueuePreferences(newPreferences);
  }
}
