import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import TextInput from 'components/shared/inputs/TextInput.vue';
import TextAreaInput from 'components/shared/inputs/TextAreaInput.vue';
import SliderInput from 'components/shared/inputs/SliderInput.vue';

import {
  Timer,
} from 'services/chatbot/chatbot-interfaces';

import {
  ITextMetadata,
  ISliderMetadata
} from 'components/shared/inputs/index';

@Component({
  components: {
    TextAreaInput,
    TextInput,
    SliderInput
  }
})
export default class ChatbotTimerWindow extends ChatbotWindowsBase {
  newTimer: Timer = {
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

  intervalMetadata: ISliderMetadata = {
    min: 0,
    max: 150,
  }

  chatLinesMetadata: ISliderMetadata = {
    min: 0,
    max: 100
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    this.chatbotApiService.createTimer(this.newTimer);
  }
}
