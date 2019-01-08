import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { INumberMetadata, EInputType } from 'components/shared/inputs/index';

import { NEW_ALERT_MODAL_ID } from 'services/chatbot';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';

@Component({
  components: {
    VFormGroup,
    TextInput,
    TextAreaInput,
    ListInput,
    NumberInput,
    ValidatedForm,
  },
})
export default class ChatbotGenericModalWindow extends Vue {
  @Prop()
  isInputModal: boolean;

  @Prop()
  title: string;

  @Prop()
  header: string;

  @Prop()
  message: string;

  @Prop()
  name: string;

  $refs: {
    form: ValidatedForm;
  };

  valueMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    max: 100000,
    placeholder: $t(this.message),
  };

  value: number = 0;

  get hasOkListener() {
    return this.$listeners && this.$listeners.ok;
  }

  get hasCancelListener() {
    return this.$listeners && this.$listeners.cancel;
  }

  get hasYesListener() {
    return this.$listeners && this.$listeners.yes;
  }

  get hasNoListener() {
    return this.$listeners && this.$listeners.no;
  }

  onCancelHandler() {
    this.$modal.hide(NEW_ALERT_MODAL_ID);
  }

  onEmitHandler(action: string) {
    this.$emit(action, this.value);
    this.$modal.hide(this.name);
  }
}
