import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WrappedChat } from 'services/nicolive-program/nicolive-comment-viewer';
import { parseContent } from 'services/nicolive-program/ChatMessage/util';

@Component({})
export default class GiftComment extends Vue {
  @Prop() chat: WrappedChat;

  get computedContent() {
    const parsed = parseContent(this.chat.value);
    const [itemId, userId, advertiserName, point, message, itemName, contributionRank] = parsed.values;
    const contributionMessage = contributionRank ? `（第 ${contributionRank} 位）` : '';
    return `${advertiserName} さんが「${itemName}」を贈りました。「${message}」${contributionMessage}`;
  }
}
