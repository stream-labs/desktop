import cloneDeep from 'lodash/cloneDeep';
import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import { TextInput } from 'components/shared/inputs/inputs';
import styles from './CommunityHub.m.less';
import { $t, I18nService } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService, IFriend } from 'services/community-hub';

@Component({})
export default class AddChatModal extends TsxComponent {
  @Inject() communityHubService: CommunityHubService;
  @Inject() i18nService: I18nService;

  chatName = '';
  searchValue = '';
  avatar = '';
  friends = cloneDeep(this.communityHubService.state.friends);
  selectedFriends: Array<IFriend> = [];

  updateSearch(val: string) {
    const allFriends = cloneDeep(this.communityHubService.state.friends);
    const locale = this.i18nService.state.locale;
    this.searchValue = val;
    if (val === '') return (this.friends = allFriends);
    this.friends = allFriends.filter(friend =>
      friend.username.toLocaleLowerCase(locale).includes(val.toLocaleLowerCase(locale)),
    );
  }

  handleRemove(friendId: string) {
    this.selectedFriends = this.selectedFriends.filter(friend => friend.id !== friendId);
  }

  addChat() {
    this.communityHubService.addChat(this.selectedFriends, this.chatName, this.avatar);
  }

  render() {
    return (
      <div class={styles.addChatContainer}>
        <div class={styles.addChatModal}>
          <h2>{$t('New Message')}</h2>
          <TextInput vModel={this.chatName} />
          <TextInput
            onInput={(val: string) => this.updateSearch(val)}
            value={this.searchValue}
            metadata={{ placeholder: $t('Search Friends'), icon: 'icon-search' }}
          />
          <button class="button button--default">{$t('Go')}</button>
          <ul class={styles.selectedFriends}>
            {this.selectedFriends.map((friend, i) => (
              <li key={i} onClick={() => this.handleRemove(friend.id)}>
                {friend.username}
              </li>
            ))}
          </ul>
          {$t('Recent Conversations')}
          <ul>
            {this.friends.map(friend => (
              <div class={styles.friend} onClick={() => {}}>
                <img class={styles.avatar} src={friend.avatar} />
                <div class={cx(styles.status, styles[friend.status])} />
                <div class={styles.friendName}>{friend.username}</div>
                {friend.is_prime && <i class={cx('icon-prime', styles.primeIcon)} />}
                {friend.game_streamed && (
                  <div class={styles.friendStreaming}>
                    {$t('Streaming %{gameTitle}', { gameTitle: friend.game_streamed })}
                  </div>
                )}
              </div>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}
