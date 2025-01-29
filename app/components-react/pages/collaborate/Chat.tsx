import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import styles from './Collaborate.m.less';
import { $t } from 'services/i18n';
import { IMessage } from 'services/live-chat';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { TextAreaInput } from 'components-react/shared/inputs';

export default function Chat(p: { currentChat: string }) {
  const { CollaborateService, LiveChatService } = Services

  const messagesRef = useRef<HTMLElement | null>(null);

  const [message, setMessage] = useState('');

  const { messages, members } = useVuex(() => ({
    messages: LiveChatService.views.messages(p.currentChat),
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
      members.find(chatter => message.user_id === chatter.id) || CollaborateService.self;
    const isSelf = chatter.id === CollaborateService.self.id;
    return (
      <div className={cx(styles.messageContainer, { [styles.self]: isSelf })}>
        <img className={styles.avatar} src={message.avatar} />
        <div className={cx(styles.status, styles[chatter.status])} />
        <div className={styles.nameAndBubble}>
          <span style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            {message.display_name}
          </span>
          <div className={cx(styles.chatBubble, { [styles.self]: isSelf })}>{message.message}</div>
        </div>
      </div>
    );
  }

  function handleEnter() {
    if (!message) return;
    LiveChatService.actions.sendMessage(message);
    setMessage('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: `calc(100% - 30px)` }}>
      <div className={styles.chatContainer} ref="messages">
        {messages.map(message => <ChatMessage message={message} />)}
      </div>
      <div className={styles.chatInput}>
        <TextAreaInput
          value={message}
          onChange={setMessage}
          placeholder="Message []"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <i className="fas fa-smile" style={{ fontSize: '20px' }} />
          <button className="button button--default" style={{ marginLeft: '16px' }}>
            {'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
