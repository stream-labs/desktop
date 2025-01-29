import React, { useState } from 'react';
import cx from 'classnames';
import SideBar from './SideBar';
import ChatInfo from './ChatInfo';
// import AddChatModal from './AddChatModal';
// import AddFriendModal from './AddFriendModal';
import styles from './Collaborate.m.less';
import { $t } from 'services/i18n';
import Matchmake from './Matchmake';
import Chat from './Chat';

const components: Dictionary<any> = {
  matchmake: Matchmake,
  friends: <></>,
  chat: Chat,
};

export default function Collaborate() {
  const [chatInfoVisible, setChatInfoVisible] = useState(true);
  const [addChatModalVisible, setAddChatModalVisible] = useState(false);
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);

  const [currentTab, setCurrentTab] = useState('matchmake');
  const [currentChat, setCurrentChat] = useState('');

  function setPage(value: string) {
    if (['matchmake', 'friendsPage'].includes(value)) {
      setCurrentTab(value);
    } else {
      setCurrentTab('chat');
      setCurrentChat(value);
    }
  }

  const titleMap: Dictionary<string> = {
    matchmake: 'Matchmaking',
    friendsPage: 'Friends',
  };

  function Title() {
    if (currentTab) return <>{titleMap[currentTab]}</>;
    const chatroom = currentChat;
    const members: any[] = [];
    const noImg = true;
    return (
      <div style={{display: 'flex', alignItems: 'center'}}>
        {!noImg && <img className={styles.avatar} src={members[0].avatar} />}
        {noImg && (
          <div
            className={cx(styles.avatar, styles.sidebarAvatar, styles.noImgAvatar)}
          >
            {chatroom[0]}
          </div>
        )}
        <div style={{ marginLeft: "16px" }}>
          {members.length === 1 ? members[0].name : chatroom}
        </div>
      </div>
    );
  }

  function Header() {
    return (
      <div className={styles.mainHeader}>
        <Title />
        {currentTab === 'friendsPage' && (
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

  const PageComponent = components[currentTab];
  const title = titleMap[currentTab];
  return (
      <div style={{ width: '100%', height: "100%" }}>
        <div style={{ width: '100%', height: '100%', display: "flex" }}>
            <SideBar onShowAddChatModal={() => setAddChatModalVisible(true)} currentTab={currentTab} setPage={setPage} />
            <div className={styles.pageContainer}>
              <Header />
              <PageComponent setPage={setPage} />
            </div>
            {!title && chatInfoVisible && (
              <ChatInfo onHideChat={() => setChatInfoVisible(false)} />
            )}
        </div>
        {/* {addChatModalVisible && (
            <AddChatModal onCloseAddChatModal={() => setAddChatModalVisible(false)} />
        )}
        {addFriendModalVisible && (
            <AddFriendModal onCloseAddFriendModal={() => setAddFriendModalVisible(false)} />
        )} */}
      </div>
  );
}