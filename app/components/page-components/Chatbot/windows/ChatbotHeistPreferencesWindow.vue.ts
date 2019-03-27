import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import cloneDeep from 'lodash/cloneDeep';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { IHeistPreferencesResponse } from 'services/chatbot';

import { metadata, formMetadata } from 'components/shared/inputs/index';
import { ITab } from 'components/Tabs.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotHeistPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general',
    },
    {
      name: $t('Messages'),
      value: 'messages',
    },
  ];

  selectedTab: string = 'general';

  newHeistPreferences: IHeistPreferencesResponse = {
    settings: {
      commands: {},
      general: {
        max_amount: 1337,
        min_entries: 1,
        payout: {
          moderators: 1,
          subscribers: 1,
          viewers: 1,
        },
        probability: {
          moderators: 1,
          subscribers: 1,
          viewers: 1,
        },
        start_delay: 120,
        cooldown: 300,
      },
      messages: {
        group: {
          loss: '',
          partial: '',
          win: '',
        },
        results: '',
        solo: {
          loss: '',
          win: '',
        },
        start: {
          fail: '',
          first: '',
          success: '',
        },
      },
    },
    enabled: false,
  };

  // metadata
  get metaData() {
    return formMetadata({
      minEntries: metadata.number({
        title: $t('Min Entries'),
        required: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isInteger: true,
      }),
      maxAmount: metadata.number({
        title: $t('Max Amount'),
        required: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        isInteger: true,
      }),
      startDelay: metadata.number({
        title: $t('Start Delay'),
        required: true,
        min: 0,
        max: 3600,
        isInteger: true,
        tooltip: $t('Delay in Seconds'),
      }),
      cooldown: metadata.number({
        title: $t('Cooldown'),
        required: true,
        min: 10,
        max: 86400,
        isInteger: true,
        tooltip: $t('Cooldown in Seconds'),
      }),
      viewersChance: metadata.number({
        title: $t('Viewer Chance'),
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
      subscribersChance: metadata.number({
        title: $t('Subscriber Chance'),
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
        tooltip: $t('Subscriber Chance'),
      }),
      moderatorsChance: metadata.number({
        title: $t('Moderator Chance'),
        required: true,
        min: 0,
        max: 100,
        isInteger: true,
      }),
      viewersPayout: metadata.number({
        title: $t('Viewer Payout'),
        required: true,
        min: 0,
        max: 10000,
        isInteger: true,
      }),
      subscribersPayout: metadata.number({
        title: $t('Subscriber Payout'),
        required: true,
        min: 0,
        max: 10000,
        isInteger: true,
      }),
      moderatorsPayout: metadata.number({
        title: $t('Moderator Payout'),
        required: true,
        min: 0,
        max: 10000,
        isInteger: true,
      }),
      firstEntry: metadata.textArea({
        title: $t('Moderator Payout'),
        placeholder: $t('On First Entry'),
        required: true,
        min: 0,
        max: 450,
        uuid: $t('On First Entry'),
        blockReturn: true,
      }),
      successfulStart: metadata.textArea({
        title: $t('On Successful Start'),
        placeholder: $t('On Successful Start'),
        uuid: $t('On Successful Start'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      failedStart: metadata.textArea({
        title: $t('On Failed Start'),
        placeholder: $t('On Failed Start'),
        uuid: $t('On Failed Start'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      results: metadata.textArea({
        title: $t('Results'),
        placeholder: $t('Results'),
        uuid: $t('Results'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      soloWin: metadata.textArea({
        title: $t('On Win'),
        placeholder: $t('On Win'),
        uuid: $t('On Win'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      soloLoss: metadata.textArea({
        title: $t('On Loss'),
        placeholder: $t('On Loss'),
        uuid: $t('On Loss'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      groupWin: metadata.textArea({
        title: $t('On Victory'),
        placeholder: $t('On Victory'),
        uuid: $t('On Victory'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      groupPartial: metadata.textArea({
        title: $t('On Partial Victory'),
        placeholder: $t('On Partial Victory'),
        uuid: $t('On Partial Victory'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
      groupLoss: metadata.textArea({
        title: $t('On Defeat'),
        placeholder: $t('On Defeat'),
        uuid: $t('On Defeat'),
        required: true,
        min: 0,
        max: 450,
        blockReturn: true,
      }),
    });
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  get heistPreferences() {
    return this.chatbotApiService.Heist.state.heistPreferencesResponse;
  }

  mounted() {
    this.newHeistPreferences = cloneDeep(this.heistPreferences);
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onResetHandler() {
    await this.chatbotApiService.Heist.resetSettings().then(response => {
      console.log(response);
      this.newHeistPreferences = response;
    });

    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Heist.updateHeistPreferences(this.newHeistPreferences);
  }
}
