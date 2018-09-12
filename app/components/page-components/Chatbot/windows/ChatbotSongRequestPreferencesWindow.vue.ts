import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { cloneDeep } from 'lodash';
import {
  IMediaShareBan
} from 'services/widget-settings/media-share';
import {
  EInputType,
} from 'components/shared/inputs/index';

import {
  ISongRequestResponse,
} from 'services/chatbot';


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

  securityDescription = $t(
    'This slider helps you filter shared media before it can be submitted.\n' +
      '1: No security\n' +
      '2: 65%+ rating, 5k+ views\n' +
      '3: 75%+ rating, 40k+ views\n' +
      '4: 80%+ rating, 300k+ views\n' +
      '5: 85%+ rating, 900k+ views'
  );

  selectedTab: string = 'general';

  songRequestPreferences: ISongRequestResponse = null;

  async mounted() {
    await this.chatbotApiService.fetchSongRequest();
    this.songRequestPreferences = cloneDeep(this.songRequestResponse);
  }

  get songRequestResponse() {
    return this.chatbotApiService.state.songRequestResponse;
  }

  get metadata() {
    return {
      settings: {
        max_duration: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Max Duration')
        }),
        security: metadataHelper.slider({
          min: 0,
          max: 4,
          interval: 1,
          description: this.securityDescription
        })
      },
      new_banned_media: metadataHelper.text({
        required: true,
        placeholder: $t('New Banned Media')
      })
    };
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  async onSaveHandler() {
    await this.chatbotApiService.updateSongRequest(this.songRequestPreferences);
    this.chatbotCommonService.closeChildWindow();
  }

  onUnbanMediaHandler(media: IMediaShareBan) {
    this.chatbotApiService.unbanMedia(media);
  }

  onCancelHandler() {
    this.chatbotCommonService.closeChildWindow();
  }
}