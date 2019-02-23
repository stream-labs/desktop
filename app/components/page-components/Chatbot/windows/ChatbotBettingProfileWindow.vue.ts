import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import { IChatbotErrorResponse, IBettingProfile, IBettingOption } from 'services/chatbot';
import { EInputType, metadata, formMetadata } from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { ITab } from 'components/Tabs.vue';
import { debounce } from 'lodash-decorators';
import ChatbotBetOptionModal from '../Bet/ChatbotBetOptionModal.vue';
import ChatbotPollProfileWindow from './ChatbotPollProfileWindow.vue';

@Component({
  components: {
    ValidatedForm,
    ChatbotBetOptionModal,
  },
})
export default class ChatbotBettingProfileWindow extends ChatbotPollProfileWindow {
  $refs: {
    form: ValidatedForm;
  };

  newProfile: IBettingProfile = {
    id: null,
    options: [],
    timer: {
      enabled: false,
      duration: 300,
    },
    loyalty: {
      min: 10,
      max: 10000,
    },
    title: '',
    send_notification: false,
  };

  get newMetaData() {
    return formMetadata({
      title: metadata.text({
        required: true,
        max: 100,
        placeholder: $t('Title'),
      }),
      duration: metadata.number({
        required: true,
        min: 1,
        max: 86400,
        placeholder: $t('Duration'),
        isInteger: true,
      }),
      min: metadata.number({
        required: true,
        min: 10,
        max: 100000,
        placeholder: $t('Minimum'),
        tooltip: $t('Minimum amount of points that is required to be bet'),
        isInteger: true,
      }),
      max: metadata.number({
        required: true,
        min: 10,
        max: 100000,
        placeholder: $t('Maximum'),
        tooltip: $t('Maximum amount of points that is allowed to be bet'),
        isInteger: true,
      }),
    });
  }

  selectedOption: IBettingOption = {
    name: null,
    parameter: null,
  };

  mounted() {
    // if editing existing custom command
    if (this.isEdit) {
      this.newProfile = _.cloneDeep(this.profileToUpdate);
    }
  }

  get isEdit() {
    return this.profileToUpdate && this.profileToUpdate.id;
  }

  get profileToUpdate() {
    return this.chatbotApiService.Common.state.bettingProfileToUpdate;
  }

  get baseCommand() {
    return `${
      this.chatbotApiService.Betting.state.bettingPreferencesResponse.settings.commands['bet']
        .command
    } `;
  }

  get MODAL_ID() {
    return 'new-betting-option';
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    if (this.newProfile.id) {
      await this.chatbotApiService.Betting.updateProfile(this.newProfile).catch(
        this.onErrorHandler,
      );
    } else {
      await this.chatbotApiService.Betting.addProfile(this.newProfile).catch(this.onErrorHandler);
    }
  }
}
