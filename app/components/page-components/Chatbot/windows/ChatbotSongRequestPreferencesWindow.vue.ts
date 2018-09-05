import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import {
  EInputType,
} from 'components/shared/inputs/index';

interface ISongRequestSettings {
  advanced_settings: {
    max_duration: number;
    security: number;
  }
}

@Component({})
export default class ChatbotSongRequestPreferencesWindow extends ChatbotWindowsBase {
  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general'
    },
    {
      name: $t('Blacklist'),
      value: 'blacklist'
    }
  ];

  selectedTab: string = 'general';

  settings: ISongRequestSettings = {
    advanced_settings: {
      max_duration: 0,
      security: 1
    }
  };

  get metadata() {
    return {
      advanced_settings: {
        max_duration: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: 'Max Duration'
        }),
        security: metadataHelper.slider({
          min: 0,
          max: 4,
          interval: 1
        })
      }
    };
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  onSaveHandler() {}

  onCancelHandler() {
    this.chatbotCommonService.closeChildWindow();
  }
}
