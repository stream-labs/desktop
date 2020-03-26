import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';
import { MessagesService, IMessage } from 'services/community-hub/messages';

@Component({})
export default class ChatPage extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;
  @Inject() messagesService: MessagesService;

  get chatroom() {
    return this.communityHubService.views.currentChat;
  }

  get messages() {
    return this.messagesService.views.messages(this.chatroom.id);
  }

  chatMessage(message: IMessage) {
    const chatter =
      this.communityHubService.views.findFriend(message.user_id) || this.communityHubService.self;
    const isSelf = chatter.id === this.communityHubService.self.id;
    return (
      <div class={cx(styles.messageContainer, { [styles.self]: isSelf })}>
        <img class={styles.avatar} src={message.avatar} />
        <div class={cx(styles.status, styles[chatter.status])} />
        <div class={styles.nameAndBubble}>
          <span style="display: flex; align-items: center; margin-bottom: 8px;">
            {message.username}
            {chatter.is_prime && <i class={cx('icon-prime', styles.primeIcon)} />}
          </span>
          <div class={cx(styles.chatBubble, { [styles.self]: isSelf })}>{message.content}</div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class={styles.chatContainer}>
        {this.messages.map(message => this.chatMessage(message))}
      </div>
    );
  }
}
