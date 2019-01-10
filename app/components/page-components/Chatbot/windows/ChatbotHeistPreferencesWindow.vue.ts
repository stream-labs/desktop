import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { IHeistPreferencesResponse } from 'services/chatbot';

import { EInputType } from 'components/shared/inputs/index';
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
          moderators: 0,
          subscribers: 0,
          viewers: 0,
        },
        probability: {
          moderators: 0,
          subscribers: 0,
          viewers: 0,
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
    return {
      minEntries: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        placeholder: $t('Min Entries'),
      },
      maxAmount: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        placeholder: $t('Max Amount'),
      },
      startDelay: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 3600,
        placeholder: $t('Start Delay'),
        tooltip: $t('Delay in Seconds'),
      },
      cooldown: {
        required: true,
        type: EInputType.number,
        min: 10,
        max: 86400,
        placeholder: $t('Cooldown'),
        tooltip: $t('Cooldown in Seconds'),
      },
      viewersChance: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('Viewer Chance'),
      },
      subscribersChance: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('Subscriber Chance'),
      },
      moderatorsChance: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 100,
        placeholder: $t('Moderator Chance'),
      },
      viewersPayout: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 10000,
        placeholder: $t('Viewer Payout'),
      },
      subscribersPayout: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 10000,
        placeholder: $t('Subscriber Payout'),
      },
      moderatorsPayout: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 10000,
        placeholder: $t('Moderator Payout'),
      },
      firstEntry: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On First Entry'),
        uuid: $t('On First Entry'),
      },
      successfulStart: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Successful Start'),
        uuid: $t('On Successful Start'),
      },
      failedStart: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Failed Start'),
        uuid: $t('On Failed Start'),
      },
      results: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('Results'),
        uuid: $t('Results'),
      },
      soloWin: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Win'),
        uuid: $t('On Win'),
      },
      soloLoss: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Loss'),
        uuid: $t('On Loss'),
      },
      groupWin: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Victory'),
        uuid: $t('On Victory'),
      },
      groupPartial: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Partial Victory'),
        uuid: $t('On Partial Victory'),
      },
      groupLoss: {
        required: true,
        type: EInputType.textArea,
        min: 0,
        max: 450,
        placeholder: $t('On Defeat'),
        uuid: $t('On Defeat'),
      },
    };
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  get heistPreferences() {
    return this.chatbotApiService.Heist.state.heistPreferencesResponse;
  }

  mounted() {
    this.newHeistPreferences = _.cloneDeep(this.heistPreferences);
  }

  @Watch('newHeistPreferences', { immediate: true, deep: true })
  @debounce(1)
  onCommandChanged(value: IHeistPreferencesResponse) {
    if (value) {
      const messages = _.cloneDeep(this.newHeistPreferences.settings.messages);

      for (const group in messages) {
        if (messages.hasOwnProperty(group)) {
          if (value[group] !== messages[group]) {
            if (typeof messages[group] === 'string' || messages[group] instanceof String) {
              messages[group] = value.settings.messages[group].replace(/(\r\n|\r|\n)/g, '');
            } else {
              for (const key in messages[group]) {
                if (messages[group].hasOwnProperty(key)) {
                  messages[group][key] = value.settings.messages[group][key].replace(
                    /(\r\n|\r|\n)/g,
                    '',
                  );
                }
              }
            }
          }
        }
      }

      this.newHeistPreferences.settings.messages = messages;
    }
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onResetHandler() {
    await this.chatbotApiService.Heist.resetSettings().then(response => {
      this.newHeistPreferences = response;
    });

    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Heist.updateHeistPreferences(this.newHeistPreferences);
  }
}
