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

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const [currentMessage, setMessage] = useState('');

  const { messages, members } = useVuex(() => ({
    messages: LiveChatService.views.messages(p.currentChat),
    members: CollaborateService.views.usersInRoom(p.currentChat),
  }));

  useEffect(() => {
    if (messagesRef.current) {
      const bottom = messagesRef.current.scrollHeight;
      messagesRef.current.scrollTop = bottom;
    }

    window.addEventListener('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'enter') {
        handleEnter();
      }
    });
  }, [messages.length, messagesRef.current])

  function ChatMessage(p: { message: IMessage }) {
    const chatter =
      members.find(chatter => p.message.user_id === chatter.id) || CollaborateService.self;
    const isSelf = chatter.id === CollaborateService.self.id;
    return (
      <div className={cx(styles.messageContainer, { [styles.self]: isSelf })}>
        <img className={styles.avatar} src={p.message.avatar} />
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

  function handleEnter() {
    if (!currentMessage) return;
    LiveChatService.actions.sendMessage(currentMessage);
    setMessage('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: `calc(100% - 30px)` }}>
      <div className={styles.chatContainer} ref={messagesRef}>
        {messages.map(message => <ChatMessage message={message} />)}
      </div>
      <div className={styles.chatInput}>
        <TextAreaInput
          value={currentMessage}
          onChange={setMessage}
          placeholder="Message []"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <i className="fas fa-smile" style={{ fontSize: '20px' }} />
          <button className="button button--default" style={{ marginLeft: '16px' }} onClick={handleEnter}>
            {'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
