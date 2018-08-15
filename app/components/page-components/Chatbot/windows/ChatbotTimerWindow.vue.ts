import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';

import {
  ITimer,
} from 'services/chatbot/chatbot-interfaces';

import {
  ITextMetadata,
  INumberMetadata
} from 'components/shared/inputs/index';

@Component({})
export default class ChatbotTimerWindow extends ChatbotWindowsBase {
  newTimer: ITimer = {
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
    alpha: true
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

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    if (this.isEdit) {
      this.chatbotApiService.updateTimer(this.timerToUpdate.id, this.newTimer);
      return;
    }
    this.chatbotApiService.createTimer(this.newTimer);
  }
}
