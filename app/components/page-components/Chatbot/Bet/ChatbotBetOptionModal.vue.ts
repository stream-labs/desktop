import { Component, Prop, Watch } from 'vue-property-decorator';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { EInputType, formMetadata } from 'components/shared/inputs/index';

import { IBettingOption } from 'services/chatbot';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ChatbotWindowsBase from '../windows/ChatbotWindowsBase.vue';
import { debounce } from 'lodash-decorators';
import { metadata } from 'components/widgets/inputs';

@Component({
  components: {
    VFormGroup,
    TextAreaInput,
    ListInput,
    NumberInput,
    ValidatedForm,
  },
})
export default class ChatbotBetOptionModal extends ChatbotWindowsBase {
  $refs: {
    modalForm: ValidatedForm;
  };

  @Prop({
    default: {
      name: null,
      parameter: null,
    },
  })
  option: IBettingOption;

  @Prop() index: number = -1;

  get metaData() {
    return formMetadata({
      name: metadata.text({
        required: true,
        max: 75,
        placeholder: $t('Option'),
      }),
      parameter: metadata.text({
        required: true,
        max: 20,
        placeholder: $t('Command'),
      }),
    });
  }

  get isEdit() {
    return this.option && this.option.name;
  }

  get NEW_BETTING_OPTION_MODAL_ID() {
    return 'new-betting-option';
  }

  get baseCommand() {
    return `${
      this.chatbotApiService.Betting.state.bettingPreferencesResponse.settings.commands['bet']
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
  onSymbolProtChanged(value: IBettingOption) {
    if (value && value.parameter) {
      this.option.parameter = value.parameter.replace(/ +/g, '');
    }
  }

  onCancelNewItemModalHandler() {
    this.$modal.hide(this.NEW_BETTING_OPTION_MODAL_ID);
  }

  async onAddNewItemHandler() {
    if (await this.$refs.modalForm.validateAndGetErrorsCount()) return;
    this.$emit('add', this.option, this.index);

    this.$modal.hide(this.NEW_BETTING_OPTION_MODAL_ID);
  }
}
