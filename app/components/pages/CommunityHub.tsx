import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import SideBar from './community-hub/SideBar';
import ChatInfo from './community-hub/ChatInfo';
import AddChatModal from './community-hub/AddChatModal';
import AddFriendModal from './community-hub/AddFriendModal';
import styles from './community-hub/CommunityHub.m.less';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';
import { $t } from 'services/i18n';

@Component({})
export default class CommunityHub extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;

  chatInfoVisible = true;
  addChatModalVisible = false;
  addFriendModalVisible = false;

  get currentTab() {
    return this.communityHubService.views.currentPage;
  }

  get title() {
    if (this.currentTab.title) return this.currentTab.title;
    const chatroom = this.communityHubService.views.currentChat;
    const members = this.communityHubService.views.usersInRoom(chatroom.name);
    const noImg = members.length > 1 && (!chatroom.avatar || /^#/.test(chatroom.avatar));
    return (
      <div style="display: flex; align-items: center;">
        {!noImg && <img class={styles.avatar} src={members[0].avatar} />}
        {noImg && (
          <div
            class={cx(styles.avatar, styles.sidebarAvatar, styles.noImgAvatar)}
            style={`background: ${chatroom.avatar};`}
          >
            {chatroom.title[0]}
          </div>
        )}
        <div style="margin-left: 16px;">
          {members.length === 1 ? members[0].name : chatroom.title}
        </div>
      </div>
    );
  }

  get header() {
    return (
      <div class={styles.mainHeader}>
        {this.title}
        {this.communityHubService.state.currentPage === 'friendsPage' && (
          <button
            class="button button--trans"
            style="margin-left: auto;"
            onClick={() => (this.addFriendModalVisible = true)}
          >
            <i class="icon-add-circle" />
            {$t('Add Friends')}
          </button>
        )}
      </div>
    );
  }

  render() {
    const PageComponent = this.currentTab.component;
    return (
      <div style="width: 100%; height: 100%;">
        <div style="width: 100%; height: 100%; display: flex;">
          <SideBar onShowAddChatModal={() => (this.addChatModalVisible = true)} />
          <div class={styles.pageContainer}>
            {this.header}
            <PageComponent />
          </div>
          {!this.currentTab.title && this.chatInfoVisible && (
            <ChatInfo onHideChat={() => (this.chatInfoVisible = false)} />
          )}
        </div>
        {this.addChatModalVisible && (
          <AddChatModal onCloseAddChatModal={() => (this.addChatModalVisible = false)} />
        )}
        {this.addFriendModalVisible && (
          <AddFriendModal onCloseAddFriendModal={() => (this.addFriendModalVisible = false)} />
        )}
      </div>
    );
  }
}
