import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import styles from './Collaborate.m.less';
import { $t } from 'services/i18n';
import { IMessage } from 'services/live-chat';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { TextInput } from 'components-react/shared/inputs';

export default function Chat(p: { currentChat: string }) {
  const { CollaborateService, LiveChatService } = Services

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const [currentMessage, setCurrentMessage] = useState('');

  const { messages, members } = useVuex(() => ({
    messages: LiveChatService.views.messages('Comfy Card Dads'),
    members: CollaborateService.views.usersInRoom(p.currentChat),
  }));

  useEffect(() => {
    if (messagesRef.current) {
      const bottom = messagesRef.current.scrollHeight;
      messagesRef.current.scrollTop = bottom;
    }
  }, [messages.length, messagesRef.current])

  function ChatMessage(p: { message: IMessage }) {
    const chatter =
      members.find(chatter => p.message.user_id === chatter.id) || CollaborateService.self;
    const isSelf = p.message.user_id === CollaborateService.self.id;
    return (
      <div className={cx(styles.messageContainer, { [styles.self]: isSelf })}>
        {p.message.avatar !== '' && <img className={styles.avatar} src={p.message.avatar} />}
        {p.message.avatar === '' && <div className={cx(styles.avatar, styles.sidebarAvatar, styles.noImgAvatar)}>{p.message.display_name[0]}</div>}
        <div className={cx(styles.status, styles[chatter.status])} />
        <div className={styles.nameAndBubble}>
          <span style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            {p.message.display_name}
          </span>
          <div className={cx(styles.chatBubble, { [styles.self]: isSelf })}>{p.message.message}</div>
        </div>
      </div>
    );
  }

  function handleEnter(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      sendMessage();
    }
  }

  function sendMessage() {
    if (!currentMessage) return;
    LiveChatService.actions.sendMessage(currentMessage);
    setCurrentMessage('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: `calc(100% - 30px)` }}>
      <div className={styles.chatContainer} ref={messagesRef}>
        {messages.map(message => <ChatMessage message={message} />)}
      </div>
      <div className={styles.chatInput}>
        <TextInput
          value={currentMessage}
          onChange={setCurrentMessage}
          onKeyDown={handleEnter}
          placeholder="Message Comfy Card Dads"
          uncontrolled={false}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <i className="fas fa-smile" style={{ fontSize: '20px' }} />
          <button className="button button--default" style={{ marginLeft: '16px' }} onClick={sendMessage}>
            {'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
