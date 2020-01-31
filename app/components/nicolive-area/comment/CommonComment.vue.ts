import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseContent } from 'services/nicolive-program/ChatMessage/util';

@Component({})
export default class CommonComment extends Vue {
  @Prop() chat: WrappedChat;
  @Prop({ default: false }) commentMenuOpened: boolean;
  @Prop() vposToLiveTime: (vpos: number) => string;

  get computedContent() {
    const parsed = parseContent(this.chat.value);
    return parsed.values.join(' ');
  }

  get computedTitle() {
    return `${this.computedContent} (${this.$props.vposToLiveTime(this.chat.value.vpos)})`
  }
}
