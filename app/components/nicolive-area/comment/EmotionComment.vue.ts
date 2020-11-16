import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseCommandArgument } from 'services/nicolive-program/ChatMessage/util';
import { ChatMessage } from 'services/nicolive-program/MessageServerClient';

@Component({})
export default class CommonComment extends Vue {
  @Prop() chat: WrappedChat;
  @Prop() getFormattedLiveTime: (chat: ChatMessage) => string;

  get computedContent() {
    return parseCommandArgument(this.chat.value);
  }

  get computedTitle() {
    return `${this.computedContent} (${this.$props.getFormattedLiveTime(this.chat.value)})`
  }
}
