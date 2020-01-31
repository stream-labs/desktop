import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseJsonContent } from 'services/nicolive-program/ChatMessage/util';

@Component({})
export default class CommonComment extends Vue {
  @Prop() chat: WrappedChat;

  get computedContent() {
    const parsed = parseJsonContent(this.chat.value);
    return parsed.value.message ?? '';
  }
}
