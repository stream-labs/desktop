import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';

import {
  IChatbotTimer,
  IChatbotErrorResponse,
  IChatbotLoyalty
} from 'services/chatbot';

import {
  ITextMetadata,
  INumberMetadata,
  EInputType
} from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({
  components: { ValidatedForm }
})
export default class ChatbotLoyaltyWindow extends ChatbotWindowsBase {

  $refs: {
    form: ValidatedForm;
  };

  newLoyalty: IChatbotLoyalty = {
    points: 0,
    time: 0,
    viewer: {
      name: null
    }
  };

  // metadata
  pointsMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    placeholder: $t('Points')
  };

  timeMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    placeholder: $t('Time Watched (Value in Minutes)')
  };

  mounted() {
    // if editing existing custom command
    if (this.isEdit) {
      this.newLoyalty = cloneDeep(this.loyaltyToUpdate);
    }
  }

  get isEdit() {
    return this.loyaltyToUpdate && this.loyaltyToUpdate.id;
  }

  get loyaltyToUpdate() {
    return this.chatbotApiService.Common.state.loyaltyToUpdate;
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

      this.chatbotApiService
        .Loyalty
        .updateLoyalty(this.newLoyalty.id, this.newLoyalty)
        .catch(this.onErrorHandler);
      return;
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This timer name is already taken. Try another name.'));
    }
  }
}
