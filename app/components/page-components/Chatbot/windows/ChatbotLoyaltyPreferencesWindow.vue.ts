import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';

import {
  IChatbotErrorResponse,
  ILoyaltyPreferencesResponse
} from 'services/chatbot';

import {
  ITextMetadata,
  INumberMetadata,
  EInputType
} from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { ITab } from 'components/Tabs.vue';
import { cloneDeep } from 'lodash';
import { debounce } from 'lodash-decorators';
import ChatbotLoyaltyImporter from '../Importer/ChatbotLoyaltyImporter.vue';

@Component({
  components: { ValidatedForm, ChatbotLoyaltyImporter }
})
export default class ChatbotLoyaltyPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newLoyaltyPreferences: ILoyaltyPreferencesResponse = {
    settings: {
      commands: {},
      general: {
        interval: {
          live: 5
        },
        name: 'points',
        payout: {
          active: 0,
          live: 1
        }
      },
      advanced: {
        donations: {
          extralife: 0,
          streamlabs: 0,
          superchat: 0
        },
        event: {
          on_follow: 0,
          on_host: 0,
          on_member: 0,
          on_raid: 0,
          on_sub: 0
        }
      }
    },
    enabled: false
  };

  tabs: ITab[] = [];

  // metadata
  loyaltyNameMetaData: ITextMetadata = {
    required: true,
    type: EInputType.text,
    max: 100,
    placeholder: $t('Points'),
    tooltip: $t('Name of your currency.')
  };

  livePayoutMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 100,
    placeholder: $t('Live Payout Amount')
  };

  activePayoutMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 100,
    placeholder: $t('Active Payout Amount'),
    tooltip: $t(
      'Currency that a viewer will earn on top of the Live amount when they talk in your chat.'
    )
  };

  liveIntervalMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 100,
    placeholder: $t('Live Payout Amount'),
    tooltip: $t('Amount of time between each payout.')
  };

  onFollowMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Follow Bonus'),
    tooltip: $t('Amount of currency a viewer will receive when following.')
  };

  onSubMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Subscriber Bonus'),
    tooltip: $t('Amount of currency a viewer will receive when subscribing.')
  };

  onHostMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Host Bonus'),
    tooltip: $t(
      'Amount of currency a viewer will receive when hosting the channel.'
    )
  };

  onRaidMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Raid Bonus'),
    tooltip: $t(
      'Amount of currency a viewer will receive when raiding the channel.'
    )
  };

  onStreamlabsMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Donation Bonus')
  };

  onExtraLifeMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Super Chat Bonus')
  };

  onSuperChatMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: 10000,
    placeholder: $t('Super Chat Bonus')
  };

  selectedTab: string = 'general';

  mounted() {
    this.tabs = [
      {
        name: $t('General'),
        value: 'general'
      },
      {
        name: $t('Advanced'),
        value: 'advanced'
      }
    ];

    if (this.isTwitch) {
      this.tabs.push({
        name: $t('Import'),
        value: 'import'
      });
    }

    this.chatbotApiService.Loyalty.fetchLoyaltyPreferences().then(() => {
      this.newLoyaltyPreferences = cloneDeep(this.loyaltyPreferences);
    });
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  get minAmount() {
    return (
      this.newLoyaltyPreferences.settings.general.payout.live *
      60 /
      this.newLoyaltyPreferences.settings.general.interval.live
    ).toFixed(2);
  }

  get isTwitch() {
    return this.chatbotApiService.Base.userService.platform.type === 'twitch';
  }

  get loyaltyPreferences() {
    return this.chatbotApiService.Loyalty.state.loyaltyPreferencesResponse;
  }

  get maxAmount() {
    return (
      (this.newLoyaltyPreferences.settings.general.payout.live +
        this.newLoyaltyPreferences.settings.general.payout.active) *
      60 /
      this.newLoyaltyPreferences.settings.general.interval.live
    ).toFixed(2);
  }

  @Watch('newLoyaltyPreferences.settings.general.interval.live')
  onQueryChangeHandler(value: number) {
    this.livePayoutMetaData.tooltip =
      'Currency that a viewer will earn when you are live every ' +
      value +
      ' minutes.';
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Loyalty.updateLoyaltyPreferences(
      this.newLoyaltyPreferences
    ).catch(this.onErrorHandler);
    return;
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This timer name is already taken. Try another name.'));
    }
  }
}
