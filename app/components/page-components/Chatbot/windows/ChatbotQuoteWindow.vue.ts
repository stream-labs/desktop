import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import {
  IQuote,
  IChatbotErrorResponse
} from 'services/chatbot/chatbot-interfaces';

@Component({
  components: { ValidatedForm }
})
export default class ChatbotTimerWindow extends ChatbotWindowsBase {

  $refs: {
    form: ValidatedForm;
  };

  newQuote: IQuote = {
    message: null,
    game: null,
    added_by: null,
  };

  // metadata
  get metadata() {
    return {
      message: metadataHelper.textArea({
        required: true,
        placeholder: 'Quote'
      }),
      game: metadataHelper.text({
        required: true,
        placeholder: 'Game'
      }),
      added_by: metadataHelper.text({
        required: true,
        placeholder: 'Added by'
      })
    }
  }

  mounted() {
    // if editing existing custom command
    if (this.isEdit) {
      this.newQuote = cloneDeep(this.quoteToUpdate);
    }
  }

  get isEdit() {
    return this.quoteToUpdate && this.quoteToUpdate.id;
  }

  get quoteToUpdate() {
    return this.chatbotCommonService.state.quoteToUpdate;
  }

  onCancelHandler() {
    this.chatbotCommonService.closeChildWindow();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    if (this.isEdit) {
      this.chatbotApiService
        .updateQuote(this.quoteToUpdate.id, this.newQuote)
        .catch(this.onErrorHandler);
      return;
    }
    this.chatbotApiService
      .createQuote(this.newQuote)
      .catch(this.onErrorHandler);
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This quopte is already taken. Try another one.'));
    }
  }
}
