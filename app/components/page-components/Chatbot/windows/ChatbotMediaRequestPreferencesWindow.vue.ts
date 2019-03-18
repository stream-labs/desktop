import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import { ITab } from 'components/Tabs.vue';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import cloneDeep from 'lodash/cloneDeep';
import { IMediaShareBan } from 'services/widgets/settings/media-share';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { ISongRequestData } from 'services/chatbot';
import { debounce } from 'lodash-decorators';
import os from 'os';
// general tab is all from chatbot api directly
// banned item is from media share api sl.com
@Component({
  components: {
    ValidatedForm,
  },
})
export default class ChatbotMediaRequestPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  securityDescription = $t(
    `This slider helps you filter shared media before it can be submitted.${os.EOL}
    1: No security${os.EOL}
    2: 65%+ rating, 5k+ views${os.EOL}
    3: 75%+ rating, 40k+ views${os.EOL}
    4: 80%+ rating, 300k+ views${os.EOL}
    5: 85%+ rating, 900k+ views`,
  );
  selectedTab: string = 'general';

  mediaRequestData: ISongRequestData = null;

  mounted() {
    this.fetchSongRequest();
  }

  async fetchSongRequest() {
    await this.chatbotApiService.MediaRequest.fetchSongRequest();
    this.mediaRequestData = cloneDeep(this.mediaRequestResponse.settings);
  }

  get mediaRequestResponse() {
    return this.chatbotApiService.MediaRequest.state.mediaRequestResponse;
  }

  get metadata() {
    return {
      general: {
        limit: metadataHelper.number({
          required: true,
          min: 1,
          max: 1000,
          placeholder: $t('Queue Limit'),
          isInteger: true,
        }),
        max_duration: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Max Duration'),
          isInteger: true,
        }),
        max_requests_per_user: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Max Requests per user'),
          isInteger: true,
        }),
        skip_votes: metadataHelper.number({
          required: true,
          min: 0,
          placeholder: $t('Number of votes to skip song'),
          isInteger: true,
        }),
        filter_level: metadataHelper.slider({
          min: 0,
          max: 4,
          interval: 1,
          description: this.securityDescription,
        }),
      },
      new_banned_media: metadataHelper.text({
        required: true,
        placeholder: $t('New Banned Media'),
      }),
    };
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    await this.chatbotApiService.MediaRequest.updateSongRequest({
      ...this.mediaRequestResponse,
      settings: this.mediaRequestData,
    });
    this.chatbotApiService.Common.closeChildWindow();
  }

  async onUnbanMediaHandler(media: IMediaShareBan) {
    await this.chatbotApiService.MediaRequest.unbanMedia(media);
    this.fetchSongRequest();
  }
}
