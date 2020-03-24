import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService, IFriend } from 'services/community-hub';

@Component({})
export default class FriendsPage extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;

  get onlineFriendCount() {
    return this.communityHubService.state.friends.filter(friend => friend.status !== 'offline')
      .length;
  }

  get friends() {
    return this.communityHubService.sortedFriends;
  }

  friendRow(friend: IFriend) {
    return (
      <div class={styles.friend}>
        <img class={styles.avatar} src={friend.avatar} />
        <div class={cx(styles.status, styles[friend.status])} />
        <div class={styles.friendName}>{friend.username}</div>
        {friend.is_prime && <i class="icon-prime" />}
        {friend.game_streamed && (
          <div class={styles.friendStreaming}>
            {$t('Streaming %{gameTitle}', { gameTitle: friend.game_streamed })}
          </div>
        )}
        <a style="margin-left: auto">{$t('Direct Message')}</a>
        <a style="margin-left: 16px">{$t('Unfriend')}</a>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div class={styles.friendsPageHeader}>
          {$t('Friends (%{friendCount})', { friendCount: this.onlineFriendCount })}
        </div>
        {this.friends.map(friend => this.friendRow(friend))}
      </div>
    );
  }
}
