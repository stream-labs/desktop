import React from 'react';
import cx from 'classnames';
import styles from './Collaborate.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

export default function SideBar(p: { onShowAddChatModal: (val: boolean) => void; currentTab: string; setPage: (val: string) => void; }) {
  const { CollaborateService } = Services;

  const { groupChats } = useVuex(() => ({
    groupChats: CollaborateService.views.groupChats,
  }));

  function setPage(page: string) {
    p.setPage(page);
  }

  function GroupChatRows() {
    return (
      <div>
        <span className={styles.chatHeader}>
          {$t('Group Chats')}
          <i className="icon-add-circle" onClick={() => p.onShowAddChatModal(true)} />
        </span>
        {groupChats.map(chat => {
          const noImg = true;
          return (
            <div
              className={cx(styles.chatRow, { [styles.active]: p.currentTab === chat.name })}
              onClick={() => setPage(chat.name)}
              key={chat.name}
            >
              {noImg && (
                <div
                  className={cx(styles.avatar, styles.sidebarAvatar, styles.noImgAvatar)}
                  style={{ background: `${chat.avatar}` }}
                >
                  {chat.title[0]}
                </div>
              )}
              <div className={styles.chatName}>{chat.title}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function DirectMessageRows() {
    const directMessages = CollaborateService.views.directMessages;
    return (
      <div>
        <span className={styles.chatHeader}>
          {'Direct Messages'}
          <i className="icon-add-circle" onClick={() => p.onShowAddChatModal(true)} />
        </span>
        {directMessages.map(chat => {
          const friend = CollaborateService.views.usersInRoom(chat.name)[0];
          return (
            <div
              className={cx(styles.chatRow, { [styles.active]: p.currentTab === chat.name })}
              onClick={() => setPage(chat.name)}
              key={chat.name}
            >
              <img className={styles.avatar} src={friend.avatar} />
              <div className={cx(styles.status, styles[friend.status])} />
              <div className={styles.chatName}>{friend.name}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <span
        className={cx(styles.mainTab, { [styles.active]: p.currentTab === 'matchmaking' })}
        onClick={() => setPage('matchmaking')}
      >
        <i className="icon-media-share-3" />
        {'Matchmaking'}
      </span>
      <span
        className={cx(styles.mainTab, { [styles.active]: p.currentTab === 'friendsPage' })}
        onClick={() => setPage('friendsPage')}
      >
        <i className="icon-team-2" />
        {$t('Friends (0 Online)', {
          friendCount: CollaborateService.views.onlineFriendCount,
        })}
      </span>
      <GroupChatRows />
      <DirectMessageRows />
    </div>
  );
}