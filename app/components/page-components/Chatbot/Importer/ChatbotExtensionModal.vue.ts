import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Component, Prop, Watch } from 'vue-property-decorator';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { INumberMetadata, EInputType } from 'components/shared/inputs/index';

import { IPollOption } from 'services/chatbot';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ChatbotWindowsBase from '../windows/ChatbotWindowsBase.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: {
    VFormGroup,
    TextInput,
    TextAreaInput,
    ListInput,
    NumberInput,
    ValidatedForm
  }
})
export default class ChatbotExtensionModal extends ChatbotWindowsBase {
  $refs: {
    modalForm: ValidatedForm;
  };

  get MODAL_NAME() {
    return 'extension-modal';
  }
  
  continueHandler() {
    this.chatbotApiService.Importer.importExtension();
    this.$modal.hide(this.MODAL_NAME);
  }

  cancelHandler() {
    this.$modal.hide(this.MODAL_NAME);
  }
}
