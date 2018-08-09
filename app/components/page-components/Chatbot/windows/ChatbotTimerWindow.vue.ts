import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';

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
    placeholder: 'Name of the timer'
  };
  messageMetadata: ITextMetadata = {
    required: true,
    placeholder: 'This phrase will appear after the timer has ended'
  };

  intervalMetadata: INumberMetadata = {
    min: 0,
    max: 150,
    placeholder: 'Interval in minutes'
  }

  chatLinesMetadata: INumberMetadata = {
    min: 0,
    max: 100,
    placeholder: 'Minimum chat lines'
  }

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
