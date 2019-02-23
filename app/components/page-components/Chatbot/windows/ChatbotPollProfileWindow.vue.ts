import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';
import * as _ from 'lodash';
import {
  IChatbotErrorResponse,
  IPollOption,
  IPollProfile,
  IBettingProfile,
  IBettingOption,
} from 'services/chatbot';
import { EInputType } from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { ITab } from 'components/Tabs.vue';
import { debounce } from 'lodash-decorators';
import ChatbotPollOptionModal from '../Poll/ChatbotPollOptionModal.vue';

@Component({
  components: {
    ValidatedForm,
    ChatbotPollOptionModal,
  },
})
export default class ChatbotPollProfileWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newProfile: IPollProfile = {
    id: null,
    options: [],
    timer: {
      enabled: false,
      duration: 300,
    },
    title: '',
    send_notification: false,
  };

  tabs: ITab[] = [
    {
      name: $t('General'),
      value: 'general',
    },
    {
      name: $t('Advanced'),
      value: 'advanced',
    },
  ];

  get metaData() {
    return {
      title: {
        required: true,
        type: EInputType.text,
        max: 100,
        placeholder: $t('Title'),
      },
      duration: {
        required: true,
        type: EInputType.number,
        min: 0,
        max: 86400,
        placeholder: $t('Duration'),
      },
    };
  }

  selectedOption: IPollOption = {
    name: null,
    parameter: null,
  };

  selectedIndex: number = -1;

  selectedTab: string = 'general';

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
    return this.chatbotApiService.Common.state.pollProfileToUpdate;
  }

  get baseCommand() {
    return `${
      this.chatbotApiService.Poll.state.pollPreferencesResponse.settings.commands['vote'].command
    } `;
  }

  get MODAL_ID() {
    return 'new-poll-option';
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  onSelectTabHandler(tab: string) {
    this.selectedTab = tab;
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    if (this.newProfile.id) {
      await this.chatbotApiService.Poll.updatePollProfile(this.newProfile).catch(
        this.onErrorHandler,
      );
    } else {
      await this.chatbotApiService.Poll.addPollProfile(this.newProfile).catch(this.onErrorHandler);
    }
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This title is already taken. Try another title.'));
    }
  }

  onAddOptionHandler(option: IPollOption | IBettingOption, index: number) {
    if (!option) {
      this.selectedOption = {
        name: null,
        parameter: null,
      };
    } else {
      this.selectedOption = _.cloneDeep(option);
    }

    this.selectedIndex = index;
    this.$modal.show(this.MODAL_ID);
  }

  onAddedHandler(option: IPollOption | IBettingOption = null, index: number = -1) {
    const dupeIndex = _.findIndex(this.newProfile.options, x => {
      return (
        x.name.toLowerCase() === option.name.toLowerCase() ||
        x.parameter.toLowerCase() === option.parameter.toLowerCase()
      );
    });

    if (dupeIndex === -1 && index === -1) {
      this.newProfile.options.push(option);
    } else if (dupeIndex === index) {
      this.newProfile.options.splice(index, 1, option);
    }

    this.selectedOption = {
      name: null,
      parameter: null,
    };

    this.selectedIndex = -1;
  }

  onRemoveOptionHandler(index: number) {
    this.newProfile.options.splice(index, 1);
  }
}
