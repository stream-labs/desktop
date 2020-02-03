import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseContent } from 'services/nicolive-program/ChatMessage/util';

@Component({})
export default class GiftComment extends Vue {
  @Prop() chat: WrappedChat;
  @Prop() vposToLiveTime: (vpos: number) => string;

  get computedContent() {
    const parsed = parseContent(this.chat.value);
    const [_itemId, _userId, advertiserName, point, _message, itemName, contributionRank] = parsed.values;
    const contributionMessage = contributionRank ? `【ギフト貢献第${contributionRank}位】 ` : '';
    return `${contributionMessage}${advertiserName}さんが「${itemName}（${point}pt）」を贈りました`;
  }

  get computedTitle() {
    return `${this.computedContent} (${this.$props.vposToLiveTime(this.chat.value.vpos)})`
  }
}
