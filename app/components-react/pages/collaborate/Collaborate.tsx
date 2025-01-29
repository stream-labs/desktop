import React, { useState } from 'react';
import cx from 'classnames';
import SideBar from './SideBar';
import ChatInfo from './ChatInfo';
import AddChatModal from './AddChatModal';
import AddFriendModal from './AddFriendModal';
import styles from './Collaborate.m.less';
import { $t } from 'services/i18n';
import Matchmake from './Matchmake';

const components: Dictionary<React.ReactNode> = {
  matchmake: Matchmake,
  friends: <></>,
  chat: <></>,
};

export default function Collaborate() {
  const [chatInfoVisible, setChatInfoVisible] = useState(true);
  const [addChatModalVisible, setAddChatModalVisible] = useState(false);
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);

  const [currentTab, setCurrentTab] = useState({ value: 'matchmake', title: 'Matchmake'});
  const [currentChat, setCurrentChat] = useState({ name: '', avatar: '' });

  function Title() {
    if (currentTab.title) return <>{currentTab.title}</>;
    const chatroom = currentChat;
    const members: any[] = [];
    const noImg = true;
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
        {!noImg && <img className={styles.avatar} src={members[0].avatar} />}
        {noImg && (
          <div
            className={cx(styles.avatar, styles.sidebarAvatar, styles.noImgAvatar)}
            style={{ background: `${chatroom.avatar}` }}
          >
            {chatroom.name[0]}
          </div>
        )}
        <div style={{ marginLeft: "16px" }}>
          {members.length === 1 ? members[0].name : chatroom.name}
        </div>
      </div>
    );
  }

  function Header() {
    return (
      <div className={styles.mainHeader}>
        <Title />
        {currentTab.value === 'friendsPage' && (
          <button
            className="button button--trans"
            style={{ marginLeft: 'auto' }}
            onClick={() => setAddFriendModalVisible(true)}
          >
            <i className="icon-add-circle" />
            {'Add Friends'}
          </button>
        )}
      </div>
    );
  }

  const PageComponent = components[currentTab.value];
  return (
      <div style={{ width: '100%', height: "100%" }}>
        <div style={{ width: '100%', height: '100%', display: "flex" }}>
            <SideBar onShowAddChatModal={() => setAddChatModalVisible(true)} />
            <div className={styles.pageContainer}>
              <Header />
              <PageComponent />
            </div>
            {!currentTab.title && chatInfoVisible && (
              <ChatInfo onHideChat={() => setChatInfoVisible(false)} />
            )}
        </div>
        {addChatModalVisible && (
            <AddChatModal onCloseAddChatModal={() => setAddChatModalVisible(false)} />
        )}
        {addFriendModalVisible && (
            <AddFriendModal onCloseAddFriendModal={() => setAddFriendModalVisible(false)} />
        )}
      </div>
  );
}