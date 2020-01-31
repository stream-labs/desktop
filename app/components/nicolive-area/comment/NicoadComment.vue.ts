import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseJsonContent } from 'services/nicolive-program/ChatMessage/util';

@Component({})
export default class CommonComment extends Vue {
  @Prop() chat: WrappedChat;
  @Prop() vposToLiveTime: (vpos: number) => string;

  get computedContent() {
    const parsed = parseJsonContent(this.chat.value);
    return parsed.value.message ?? '';
  }

  get computedTitle() {
    return `${this.computedContent} (${this.$props.vposToLiveTime(this.chat.value.vpos)})`
  }
}
