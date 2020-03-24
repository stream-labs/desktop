import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';

@Component({})
export default class SideBar extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;

  get currentTab() {
    return this.communityHubService.state.currentPage;
  }

  get onlineFriendCount() {
    return this.communityHubService.state.friends.filter(friend => friend.status !== 'offline')
      .length;
  }

  setPage(page: string) {
    this.communityHubService.setPage(page);
  }

  render() {
    return (
      <div class={styles.sidebar}>
        <span
          class={cx(styles.mainTab, { [styles.active]: this.currentTab === 'matchmaking' })}
          onClick={() => this.setPage('matchmaking')}
        >
          <i class="icon-media-share-3" />
          {$t('Matchmaking')}
        </span>
        <span
          class={cx(styles.mainTab, { [styles.active]: this.currentTab === 'friendsPage' })}
          onClick={() => this.setPage('friendsPage')}
        >
          <i class="icon-team-2" />
          {$t('Friends (%{friendCount} Online)', { friendCount: this.onlineFriendCount })}
        </span>
        <span class={styles.chatHeader}>
          {$t('Group Chats')}
          <i class="icon-add-circle" />
        </span>
        <span class={styles.chatHeader}>
          {$t('Direct Messages')}
          <i class="icon-add-circle" />
        </span>
      </div>
    );
  }
}
