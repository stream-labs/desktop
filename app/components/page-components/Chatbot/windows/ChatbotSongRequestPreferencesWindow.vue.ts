import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import { cloneDeep } from 'lodash';
import { IMediaShareBan } from 'services/widgets/settings/media-share';
import { EInputType, } from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import {
  ISongRequestData
} from 'services/chatbot';


// general tab is all from chatbot api directly
// banned item is from media share api sl.com
@Component({
  components: {
    ValidatedForm
  }
})
export default class ChatbotSongRequestPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

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

  songRequestData: ISongRequestData = null;
  songRequestBannedMedia: IMediaShareBan[] = [];

  mounted() {
    this.fetchSongRequest();
  }

  async fetchSongRequest() {
    await this.chatbotApiService.SongRequest.fetchSongRequestPreferencesData();
    await this.chatbotApiService.SongRequest.fetchSongRequest();
    this.songRequestBannedMedia = cloneDeep(
      this.chatbotApiService.SongRequest.state.songRequestPreferencesResponse.banned_media
    );
    this.songRequestData = cloneDeep(this.songRequestResponse.settings);
  }

  get songRequestResponse() {
    return this.chatbotApiService.SongRequest.state.songRequestResponse;
  }

  get metadata() {
    return {
      general: {
        max_duration: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Max Duration')
        }),
        max_requests_per_user: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Max Requests per user')
        }),
        skip_votes: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Number of votes to skip song')
        }),
        filter_level: metadataHelper.slider({
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
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    await this.chatbotApiService.SongRequest.updateSongRequest({
      ...this.songRequestResponse,
      settings: this.songRequestData
    });
    this.chatbotApiService.Common.closeChildWindow();
  }

  async onUnbanMediaHandler(media: IMediaShareBan) {
    await this.chatbotApiService.SongRequest.unbanMedia(media);
    this.fetchSongRequest();
  }
}