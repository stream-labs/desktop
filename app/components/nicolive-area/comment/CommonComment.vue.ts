import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseContent } from 'services/nicolive-program/ChatMessage/util';

@Component({})
export default class CommonComment extends Vue {
  @Prop() chat: WrappedChat;
  @Prop({ default: false }) commentMenuOpened: boolean;

  get computedContent() {
    const parsed = parseContent(this.chat.value);
    if (this.chat.type === 'unknown') {
      return `${parsed.commandName} ${parsed.values.join(' ')}`;
    }
    return parsed.values.join(' ');
  }
}
