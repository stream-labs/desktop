import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChatWithComponent } from 'services/nicolive-program/nicolive-comment-viewer';
import { ChatMessage } from 'services/nicolive-program/MessageServerClient';
import { getDisplayText } from 'services/nicolive-program/ChatMessage/displaytext';

@Component({})
export class CommentBase extends Vue {
  @Prop() chat: WrappedChatWithComponent;
  @Prop() getFormattedLiveTime: (chat: ChatMessage) => string;

  get computedContent() {
    return getDisplayText(this.chat);
  }

  get computedTitle() {
    return `${this.computedContent} (${this.$props.getFormattedLiveTime(this.chat.value)})`;
  }
}

