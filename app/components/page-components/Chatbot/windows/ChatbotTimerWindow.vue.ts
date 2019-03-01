import { Component, Watch } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import { cloneDeep } from 'lodash';
import { $t } from 'services/i18n';

import { IChatbotTimer, IChatbotErrorResponse } from 'services/chatbot';

import { ITextMetadata, INumberMetadata, EInputType } from 'components/shared/inputs/index';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { debounce } from 'lodash-decorators';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotTimerWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newTimer: IChatbotTimer = {
    name: '',
    interval: 5,
    chat_lines: 5,
    message: '',
    platforms: 7,
    enabled: true,
  };

  // metadata
  nameMetadata: ITextMetadata = {
    required: true,
    type: EInputType.text,
    placeholder: $t('Name of the timer'),
    alphaNum: true,
    max: 25,
    uuid: $t('Name'),
  };
  messageMetadata: ITextMetadata = {
    required: true,
    type: EInputType.textArea,
    placeholder: $t('This phrase will appear after the timer has ended'),
    max: 450,
    uuid: $t('Message'),
  };

  intervalMetadata: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 1,
    max: 1440,
    placeholder: $t('Interval (Value in Minutes)'),
  };

  chatLinesMetadata: INumberMetadata = {
    required: true,
    type: EInputType.number,
    min: 1,
    max: 1000,
    placeholder: $t('Minimum chat lines'),
    tooltip: $t(
      'Set the number of chat lines that need to appear when the timer ends before the response appears.',
    ),
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
    return this.chatbotApiService.Common.state.timerToUpdate;
  }

  @Watch('newTimer', { immediate: true, deep: true })
  @debounce(1)
  onCommandChanged(value: IChatbotTimer, oldValue: IChatbotTimer) {
    if (oldValue) {
      this.newTimer.name = value.name.replace(/ +/g, '');
      this.newTimer.message = value.message.replace(/(\r\n|\r|\n)/g, '');
    }
  }

  @Watch('errors.items.length')
  @debounce(200)
  async onErrorsChanged() {
    await this.$refs.form.validateAndGetErrorsCount();
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    if (this.isEdit) {
      this.chatbotApiService.Timers.updateTimer(this.timerToUpdate.id, this.newTimer).catch(
        this.onErrorHandler,
      );
      return;
    }
    this.chatbotApiService.Timers.createTimer(this.newTimer).catch(this.onErrorHandler);
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This timer name is already taken. Try another name.'));
    }
  }
}
