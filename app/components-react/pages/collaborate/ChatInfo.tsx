import React from 'react';
import cx from 'classnames';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { IFriend } from 'services/collaborate';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

export default function ChatInfo(p: { onHideChat: () => void }) {
  const { CollaborateService } = Services;

  const { chatroom, friends, members } = useVuex(() => ({
    chatroom: CollaborateService.views.currentChat,
    friends: CollaborateService.views.sortedFriends,
    members: CollaborateService.views.usersInRoom(CollaborateService.views.currentChat?.name),
  }));

  function ContextButton(p: { chatter: IFriend }) {
    const isFriend = friends.find(friend => friend.id === p.chatter.id);
    if (isFriend) return <div className={styles.friendBadge}>{$t('Friends')}</div>;
    return <></>
  }

  function FriendRow(p: { friend: IFriend }) {
    return (
      <div className={styles.friend}>
        <div className={styles.chatRow}>
          <img className={styles.avatar} src={p.friend.avatar} />
          <div className={cx(styles.status, styles[p.friend.status])} />
          <div className={styles.chatName}>{p.friend.name}</div>
        </div>
        <div style={{ marginLeft: "auto" }} ><ContextButton chatter={p.friend} /></div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar} style={{ borderBottom: 'none' }}>
      <div className={cx(styles.chatHeader, styles.rightBarHeader)}>
        {$t('Chat Info')}
        <i className="icon-notifications" style={{ marginLeft: 'auto' }} />
        <i className="icon-close" style={{ marginLeft: "20px"}} onClick={() => p.onHideChat()} />
      </div>
      <div className={styles.chatHeader}>
        {$t('Members (%{numberOfMembers})', { numberOfMembers: members.length })}
      </div>
      {members.map(chatter => <FriendRow friend={chatter} />}
    </div>
  );
}
