import { Component, Prop, Watch } from 'vue-property-decorator';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { EInputType } from 'components/shared/inputs/index';

import { IPollOption } from 'services/chatbot';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ChatbotWindowsBase from '../windows/ChatbotWindowsBase.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: {
    VFormGroup,
    TextAreaInput,
    ListInput,
    NumberInput,
    ValidatedForm,
  },
})
export default class ChatbotPollOptionModal extends ChatbotWindowsBase {
  $refs: {
    modalForm: ValidatedForm;
  };

  @Prop({
    default: {
      name: null,
      parameter: null,
    },
  })
  option: IPollOption;

  @Prop() index: number = -1;

  get metaData() {
    return {
      name: {
        required: true,
        type: EInputType.text,
        max: 75,
        placeholder: $t('Option'),
        uuid: $t('Option'),
      },
      parameter: {
        required: true,
        type: EInputType.text,
        max: 20,
        placeholder: $t('Command'),
        uuid: $t('Option'),
      },
    };
  }

  get isEdit() {
    return this.option && this.option.name;
  }

  get NEW_POLL_OPTION_MODAL_ID() {
    return 'new-poll-option';
  }

  get baseCommand() {
    return `${
      this.chatbotApiService.Poll.state.pollPreferencesResponse.settings.commands['vote'].command
    } `;
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    if (this.$refs.modalForm) {
      await this.$refs.modalForm.validateAndGetErrorsCount();
    }
  }

  @Watch('option', { immediate: true, deep: true })
  @debounce(1)
  onOptionChanged(value: IPollOption) {
    if (value && value.parameter) {
      this.option.parameter = value.parameter.replace(/ +/g, '');
    }
  }

  onCancelNewItemModalHandler() {
    this.$modal.hide(this.NEW_POLL_OPTION_MODAL_ID);
  }

  async onAddNewItemHandler() {
    if (await this.$refs.modalForm.validateAndGetErrorsCount()) return;
    this.$emit('add', this.option, this.index);

    this.$modal.hide(this.NEW_POLL_OPTION_MODAL_ID);
  }
}
