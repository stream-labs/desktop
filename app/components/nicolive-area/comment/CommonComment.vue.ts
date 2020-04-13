import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseContent } from 'services/nicolive-program/ChatMessage/util';
import { ChatMessage } from 'services/nicolive-program/MessageServerClient';
import { getContentWithFilter } from 'services/nicolive-program/nicolive-comment-filter';

@Component({})
export default class CommonComment extends Vue {
  @Prop()
  chat: WrappedChat;
  @Prop({ default: false })
  commentMenuOpened: boolean;
  @Prop()
  getFormattedLiveTime: (chat: ChatMessage) => string;

  get computedContent() {
    if (this.chat.type === 'normal') {
      return getContentWithFilter(this.chat);
    }
    const parsed = parseContent(this.chat.value);
    return parsed.values.join(' ');
  }

  get computedTitle() {
    return `${this.computedContent} (${this.$props.getFormattedLiveTime(this.chat.value)})`;
  }
}
