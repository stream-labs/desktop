import { Component, Prop } from 'vue-property-decorator';
import { CommentBase } from './CommentBase';
import { NicoliveClient } from 'services/nicolive-program/NicoliveClient';
import { remote } from 'electron';

@Component({})
export default class CommonComment extends CommentBase {
  @Prop({ default: false }) commentMenuOpened: boolean;
  @Prop() speaking: boolean;
  @Prop() nameplateHint: boolean;

  get userIconURL(): string {
    return NicoliveClient.getUserIconURL(this.chat.value.user_id, `${this.chat.value.thread}`);
  }

  openInDefaultBrowser(event: MouseEvent): void {
    const href = (event.currentTarget as HTMLAnchorElement).href;
    const url = new URL(href);
    if (/^https?/.test(url.protocol)) {
      remote.shell.openExternal(url.toString());
    }
  }
}
