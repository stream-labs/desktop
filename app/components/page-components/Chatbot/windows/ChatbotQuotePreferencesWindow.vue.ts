import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';
import { metadata as metadataHelper } from 'components/widgets/inputs';

import {
  IQuotePreferencesGeneralSettings
} from 'services/chatbot';

import {
  ITextMetadata,
  INumberMetadata,
  EInputType
} from 'components/shared/inputs/index';

@Component({})
export default class ChatbotQuotePreferencesWindow extends ChatbotWindowsBase {

  generalSettings: IQuotePreferencesGeneralSettings = {
    date_format: null
  }

  // metadata
  get metadata() {
    return {
      date_format: metadataHelper.text({
        type: EInputType.text,
        required: true,
        placeholder: $t('Date Format')
      })
    }
  }

  get quotePreferences() {
    return this.chatbotApiService.state.quotePreferencesResponse;
  }

  mounted() {
    // if editing existing custom command
    this.generalSettings = cloneDeep(this.quotePreferences.settings.general);
  }

  onSaveHandler() {
    const newPreferences = cloneDeep(this.quotePreferences);
    newPreferences.settings.general = this.generalSettings;
    this.chatbotApiService.updateQuotePreferences(newPreferences);
  }

}
