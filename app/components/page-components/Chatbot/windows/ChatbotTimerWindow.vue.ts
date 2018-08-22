import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';

import {
  IChatbotTimer,
  IChatbotErrorResponse
} from 'services/chatbot/chatbot-interfaces';

import {
  ITextMetadata,
  INumberMetadata
} from 'components/shared/inputs/index';

@Component({})
export default class ChatbotTimerWindow extends ChatbotWindowsBase {
  newTimer: IChatbotTimer = {
    name: null,
    interval: 5,
    chat_lines: 5,
    message: null,
    platforms: 7,
    enabled: true
  };

  // metadata
  nameMetadata: ITextMetadata = {
    required: true,
    placeholder: $t('Name of the timer'),
    alphaNum: true
  };
  messageMetadata: ITextMetadata = {
    required: true,
    placeholder: $t('This phrase will appear after the timer has ended')
  };

  intervalMetadata: INumberMetadata = {
    required: true,
    min: 0,
    max: 1440,
    placeholder: $t('Interval (Value in Minutes)')
  };

  chatLinesMetadata: INumberMetadata = {
    required: true,
    min: 0,
    max: 1000,
    placeholder: $t('Minimum chat lines')
  };

  mounted() {
    // if editing existing custom command
    if (this.isEdit) {
      this.newTimer = cloneDeep(this.timerToUpdate);
    }
  }

  get isEdit() {
    return this.timerToUpdate && this.timerToUpdate.id;
  }

  get timerToUpdate() {
    return this.chatbotCommonService.state.timerToUpdate;
  }

  onCancelHandler() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSaveHandler() {
    if (this.isEdit) {
      this.chatbotApiService
        .updateTimer(this.timerToUpdate.id, this.newTimer)
        .catch(this.onErrorHandler);
      return;
    }
    this.chatbotApiService
      .createTimer(this.newTimer)
      .catch(this.onErrorHandler);
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This timer name is already taken. Try another name.'));
    }
  }
}
