import React from 'react';
import cx from 'classnames';
import styles from './Collaborate.m.less';
import { $t } from 'services/i18n';
import { IFriend } from 'services/collaborate';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import Tooltip from 'components-react/shared/Tooltip';

export default function ChatInfo(p: { onHideChat: () => void }) {
  const { CollaborateService, SourcesService, NavigationService } = Services;

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

  function openCollab() {
    const source = SourcesService.views.getSourcesByType('mediasoupconnector')[0];
    SourcesService.actions.showSourceProperties(source.sourceId);
    NavigationService.actions.navigate('Studio');
  }

  function FriendRow(p: { friend: IFriend }) {
    return (
      <div className={styles.friend}>
        <div className={styles.chatRow}>
          <img className={styles.avatar} src={p.friend.avatar} />
          <div className={cx(styles.status, styles[p.friend.status])} />
          <div className={styles.chatName}>{p.friend.name}</div>
          <Tooltip title="Collaborate">
            <i className="icon-team-2" style={{ color: 'var(--teal)', marginLeft: 16 }} onClick={openCollab} />
          </Tooltip>
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
        {$t('Members (6)', { numberOfMembers: members.length })}
      </div>
      {members.map(chatter => <FriendRow friend={chatter} />)}
    </div>
  );
}
