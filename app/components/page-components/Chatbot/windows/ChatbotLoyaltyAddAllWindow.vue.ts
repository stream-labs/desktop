import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { $t } from 'services/i18n';

import {
  IChatbotErrorResponse
} from 'services/chatbot';

import {
  INumberMetadata,
  EInputType
} from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { debounce } from 'lodash-decorators';
@Component({
  components: { ValidatedForm }
})
export default class ChatbotLoyaltyAddAllWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  amount: number = 0;

  // metadata
  amountMetaData: INumberMetadata = {
    required: true,
    type: EInputType.number,
    max: 100000,
    placeholder: $t('Amount of Points'),
    tooltip: $t('Amount to add to all of your viewers.')
  };

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged(){
    await this.$refs.form.validateAndGetErrorsCount()
  }
  
  async onOkHandler() {
    //  TODO: Setup API Call to do this
    this.chatbotApiService.Common.closeChildWindow();
  }
}
