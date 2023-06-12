import { Component, Prop } from 'vue-property-decorator';
import { CommentBase } from './CommentBase';
import { NicoliveClient } from 'services/nicolive-program/NicoliveClient';

@Component({})
export default class CommonComment extends CommentBase {
  @Prop({ default: false }) commentMenuOpened: boolean;
  @Prop() speaking: boolean;

  get userIconURL(): string {
    return NicoliveClient.getUserIconURL(this.chat.value.user_id, `${this.chat.value.thread}`);
  }
}
