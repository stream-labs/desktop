import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService, IFriend } from 'services/community-hub';
import { MessagesService } from 'services/community-hub/messages';

@Component({})
export default class ChatPage extends TsxComponent<{ onHideChat: () => void }> {
  @Inject() communityHubService: CommunityHubService;
  @Inject() messagesService: MessagesService;

  get chatroom() {
    return this.communityHubService.views.currentChat;
  }

  get friends() {
    return this.communityHubService.state.friends;
  }

  get members() {
    return this.messagesService.views.messages(this.chatroom.id);
  }

  contextButton(chatter: IFriend) {
    const isFriend = this.friends.find(friend => friend.id === chatter.id);
    if (isFriend) return <div class={styles.friendBadge}>{$t('Friends')}</div>;
  }

  friendRow(friend: IFriend) {
    return (
      <div class={styles.friend}>
        <div class={styles.chatRow}>
          <img class={styles.avatar} src={friend.avatar} />
          <div class={cx(styles.status, styles[friend.status])} />
          <div class={styles.chatName}>{friend.username}</div>
          {friend.is_prime && <i class={cx('icon-prime', styles.primeIcon)} />}
        </div>
        <div style="margin-left: auto">{this.contextButton(friend)}</div>
      </div>
    );
  }

  render() {
    return (
      <div class={styles.sidebar} style="border-bottom: none;">
        <div class={cx(styles.chatHeader, styles.rightBarHeader)}>
          {$t('Chat Info')}
          <i class="icon-notifications" style="margin-left: auto;" />
          <i class="icon-close" style="margin-left: 20px;" onClick={() => this.$emit('hideChat')} />
        </div>
        <div class={styles.chatHeader}>
          {$t('Members (%{numberOfMembers})', { numberOfMembers: this.chatroom.members.length })}
        </div>
        {this.chatroom.members.map(chatter => this.friendRow(chatter))}
      </div>
    );
  }
}
