import { Component } from 'vue-property-decorator';

import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import ListInput from 'components/shared/inputs/ListInput.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { EInputType } from 'components/shared/inputs/index';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ChatbotWindowsBase from '../windows/ChatbotWindowsBase.vue';
import electron from 'electron';

@Component({
  components: {
    VFormGroup,
    TextAreaInput,
    ListInput,
    NumberInput,
    ValidatedForm,
  },
})
export default class ChatbotStreamElementsModal extends ChatbotWindowsBase {
  $refs: {
    modalForm: ValidatedForm;
  };

  token: string = null;
  importCommands: boolean = true;
  importTimers: boolean = true;
  importLoyalty: boolean = true;

  tokenMetaData = {
    required: true,
    type: EInputType.text,
    min: 100,
    max: 600,
    placeholder: $t('JWT Token'),
    uuid: $t('JWT Token'),
  };

  get MODAL_NAME() {
    return 'streamelements-modal';
  }

  async continueHandler() {
    if (await this.$refs.modalForm.validateAndGetErrorsCount()) return;

    this.chatbotApiService.Importer.importStreamElements(
      this.token,
      this.importLoyalty,
      this.importCommands,
      this.importTimers,
    );
    this.$modal.hide(this.MODAL_NAME);
  }

  cancelHandler() {
    this.$modal.hide(this.MODAL_NAME);
  }

  openSEDashboard() {
    electron.remote.shell.openExternal('https://streamelements.com/dashboard/account/channels');
  }
}
