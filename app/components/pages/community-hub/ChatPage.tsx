import { Component, Watch } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';
import { MessagesService, IMessage } from 'services/community-hub/messages';
import { TextAreaInput } from 'components/shared/inputs/inputs';

@Component({})
export default class ChatPage extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;
  @Inject() messagesService: MessagesService;

  $refs: { messages: HTMLElement };

  message = '';

  mounted() {
    this.scrollToBottom();
  }

  @Watch('messagesLength')
  scrollToBottom() {
    this.$nextTick(() => {
      const bottom = this.$refs.messages.scrollHeight;
      this.$refs.messages.scrollTop = bottom;
    });
  }

  get chatroom() {
    return this.communityHubService.views.currentChat;
  }

  get messages() {
    return this.messagesService.views.messages(this.chatroom.id);
  }

  get messagesLength() {
    return this.messages.length;
  }

  chatMessage(message: IMessage) {
    const chatter =
      this.chatroom.members.find(chatter => message.user_id === chatter.id) ||
      this.communityHubService.self;
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

  handleEnter() {
    this.messagesService.sendMessage(this.chatroom.id, this.message);
    this.message = '';
  }

  render() {
    return (
      <div style="display: flex; flex-direction: column; height: calc(100% - 30px);">
        <div class={styles.chatContainer} ref="messages">
          {this.messages.map(message => this.chatMessage(message))}
        </div>
        <div class={styles.chatInput}>
          <TextAreaInput
            vModel={this.message}
            onEnter={() => this.handleEnter()}
            metadata={{
              placeholder: $t('Message %{chatName}', { chatName: this.chatroom.name }),
              fullWidth: true,
              fixedSize: true,
              blockReturn: true,
              min: 1,
              rows: 4,
            }}
          />
          <div style="display: flex; justify-content: flex-end; align-items: center;">
            <i class="fas fa-smile" style="font-size: 20px;" />
            <button class="button button--default" style="margin-left: 16px;">
              {$t('Send')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
