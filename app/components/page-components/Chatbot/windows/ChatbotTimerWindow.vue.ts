import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import WTextInput from 'components/shared/widget-inputs/WTextInput.vue';
import WTextAreaInput from 'components/shared/widget-inputs/WTextAreaInput.vue';
import WSliderInput from 'components/shared/widget-inputs/WSliderInput.vue';

import {
  Timer,
} from 'services/chatbot/chatbot-interfaces';

import {
  IWTextMetadata,
  IWSliderMetadata
} from 'components/shared/widget-inputs/WInput';

@Component({
  components: {
    WTextAreaInput,
    WTextInput,
    WSliderInput
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
  nameMetadata: IWTextMetadata = {
    required: true,
    placeholder: 'Name of the timer'
  };
  messageMetadata: IWTextMetadata = {
    required: true,
    placeholder: 'This phrase will appear after the timer has ended'
  };

  intervalMetadata: IWSliderMetadata = {
    min: 0,
    max: 150,
  }

  chatLinesMetadata: IWSliderMetadata = {
    min: 0,
    max: 100
  }

  onCancel() {
    this.chatbotCommonService.closeChildWindow();
  }

  onSave() {
    debugger;
    this.chatbotApiService
      .createTimer(this.newTimer)
      .then((response: Timer) => {
        debugger;
      });
  }
}
