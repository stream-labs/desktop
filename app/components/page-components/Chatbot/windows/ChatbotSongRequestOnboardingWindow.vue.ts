import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import { cloneDeep } from 'lodash';
import { IMediaShareSettings } from 'services/widget-settings/media-share';

@Component({})
export default class ChatbotSongRequestOnboardingWindow extends ChatbotWindowsBase {
  // onboarding
  step = 1;

  // get from state media share service
  settings: any = null;

  async mounted() {
    await this.chatbotApiService.fetchSongRequestPreferencesData();
    this.settings = cloneDeep(this.chatbotApiService.state.songRequestPreferencesResponse.settings);
  }

  async onToggleNextHandler() {
    if (this.step === 1) {
      await this.chatbotApiService.updateSongRequestPreferencesData({settings: this.settings});
      this.step++;
    }
    else this.chatbotCommonService.closeChildWindow();
  }

  onTogglePrevHandler() {
    if (this.step > 1) this.step --;
  }

  get onboardingData() {
    const backgroundUrlSuffix = this.nightMode ? 'night' : 'day';
    const isAutoPlay = this.settings.auto_play === true;
    return {
      1: [
        {
          title: $t('Auto Play'),
          backgroundUrl: require(
            `../../../../../media/images/chatbot/chatbot-songrequest-autoplay--${
              isAutoPlay ? 'on' : 'off'
            }--${
              backgroundUrlSuffix
            }.svg`
          ),
          description: $t(
            'Allow your songs and videos to automatically play.' +
            'Ideal experience if you have moderators, since they will filter out NSFW content.'
          ),
          onChooseHandler: () => {
            this.settings.auto_play = true;
          }
        },
        {
          title: $t("Don't Auto Play"),
          backgroundUrl: require(
            `../../../../../media/images/chatbot/chatbot-songrequest-noplay--${
            isAutoPlay ? 'off' : 'on'
            }--${
            backgroundUrlSuffix
            }.svg`
          ),
          description: $t(
            'To play the next Song or video you will need to hit play each time. ' +
            'Ideal experience if you have no moderators, ' +
            'since you will have one last chance catch NSFW content.'
          ),
          onChooseHandler: () => {
            this.settings.auto_play = false;
          }
        }
      ],
      2: [
        {
          title: $t('Add Song Request Widget'),
          subtitle: $t('step 2'),
          backgroundUrl: require(
            `../../../../../media/images/chatbot/chatbot-songrequest-step2--${
            backgroundUrlSuffix
            }.png`
          ),
          description: $t(
            'You will need to add the Chatbot widget to your scene to hear audio. ' +
            'Go to the editor and add the Chatbot widget to your desired scene.'
          ),
        },
        {
          title: $t('Go To Recent Events'),
          subtitle: $t('step 3'),
          backgroundUrl: require(
            `../../../../../media/images/chatbot/chatbot-songrequest-step3--${
            backgroundUrlSuffix
            }.png`
          ),
          description: $t(
            'You can manage your queued media from your recent events.'
          ),
        }
      ]
    }[this.step]
  }

}
