import { Component } from 'vue-property-decorator';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ChatbotWindowsBase from '../windows/ChatbotWindowsBase.vue';

@Component({
  components: {
    VFormGroup,
    TextAreaInput,
    ListInput,
    NumberInput,
    ValidatedForm,
  },
})
export default class DesktopInstructionsModal extends ChatbotWindowsBase {
  $refs: {
    modalForm: ValidatedForm;
  };

  get MODAL_NAME() {
    return 'desktop-modal';
  }
}
