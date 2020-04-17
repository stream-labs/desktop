import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';

@Component({})
export default class SideBar extends TsxComponent<{ onShowAddChatModal: () => void }> {
  @Inject() communityHubService: CommunityHubService;

  get currentTab() {
    return this.communityHubService.state.currentPage;
  }

  setPage(page: string) {
    this.communityHubService.setPage(page);
  }

  get groupChatRows() {
    const groupChats = this.communityHubService.views.groupChats;
    return (
      <div>
        <span class={styles.chatHeader}>
          {$t('Group Chats')}
          <i class="icon-add-circle" onClick={() => this.$emit('showAddChatModal')} />
        </span>
        {groupChats.map(chat => {
          const noImg = /^#/.test(chat.avatar) || !chat.avatar;
          return (
            <div
              class={cx(styles.chatRow, { [styles.active]: this.currentTab === chat.name })}
              onClick={() => this.setPage(chat.name)}
              key={chat.name}
            >
              {!noImg && <img class={cx(styles.avatar, styles.sidebarAvatar)} src={chat.avatar} />}
              {noImg && (
                <div
                  class={cx(styles.avatar, styles.sidebarAvatar, styles.noImgAvatar)}
                  style={`background: ${chat.avatar};`}
                >
                  {chat.title[0]}
                </div>
              )}
              <div class={styles.chatName}>{chat.title}</div>
            </div>
          );
        })}
      </div>
    );
  }

  get directMessageRows() {
    const directMessages = this.communityHubService.views.directMessages;
    return (
      <div>
        <span class={styles.chatHeader}>
          {$t('Direct Messages')}
          <i class="icon-add-circle" onClick={() => this.$emit('showAddChatModal')} />
        </span>
        {directMessages.map(chat => {
          const friend = this.communityHubService.views.usersInRoom(chat.name)[0];
          return (
            <div
              class={cx(styles.chatRow, { [styles.active]: this.currentTab === chat.name })}
              onClick={() => this.setPage(chat.name)}
              key={chat.name}
            >
              <img class={styles.avatar} src={friend.avatar} />
              <div class={cx(styles.status, styles[friend.status])} />
              <div class={styles.chatName}>{friend.name}</div>
              {!!friend.is_prime && <i class={cx('icon-prime', styles.primeIcon)} />}
            </div>
          );
        })}
      </div>
    );
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
          {$t('Friends (%{friendCount} Online)', {
            friendCount: this.communityHubService.views.onlineFriendCount,
          })}
        </span>
        {this.groupChatRows}
        {this.directMessageRows}
      </div>
    );
  }
}
