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
export default class AddChatModal extends TsxComponent<{ onCloseAddChatModal: () => void }> {
  @Inject() communityHubService: CommunityHubService;
  @Inject() i18nService: I18nService;

  chatName = '';
  searchValue = '';
  friends = cloneDeep(this.communityHubService.views.sortedFriends);
  selectedFriends: Array<IFriend> = [];

  updateSearch(val: string) {
    const allFriends = cloneDeep(this.communityHubService.views.sortedFriends);
    const locale = this.i18nService.state.locale;
    this.searchValue = val;
    if (val === '') return (this.friends = allFriends);
    this.friends = allFriends.filter(friend =>
      friend.name.toLocaleLowerCase(locale).includes(val.toLocaleLowerCase(locale)),
    );
  }

  selectFriend(friend: IFriend) {
    if (this.selectedFriends.find((fr: IFriend) => fr.id === friend.id)) return;
    this.selectedFriends.push(friend);
  }

  handleRemove(friendId: number) {
    this.selectedFriends = this.selectedFriends.filter(friend => friend.id !== friendId);
  }

  addChat() {
    this.communityHubService.addChat(this.selectedFriends, this.chatName);
    this.$emit('closeAddChatModal');
  }

  get friendList() {
    return (
      <div style="display: flex; flex-direction: column; height: 0; flex-grow: 1;">
        <h2 style="margin-bottom: 16px;">{$t('Recent Conversations')}</h2>
        <ul style="height: 100%; overflow-y: auto; margin: 0;">
          {this.friends.map(friend => (
            <div class={styles.friend} onClick={() => this.selectFriend(friend)} key={friend.id}>
              <img class={styles.avatar} src={friend.avatar} />
              <div class={cx(styles.status, styles[friend.status])} />
              <div class={styles.friendName}>{friend.name}</div>
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
    );
  }

  get friendSearch() {
    return (
      <div style="margin-bottom: 16px;">
        <div class={styles.row}>
          <TextInput
            onInput={(val: string) => this.updateSearch(val)}
            value={this.searchValue}
            metadata={{ placeholder: $t('Search Friends'), icon: 'search', fullWidth: true }}
            style="margin-right: 16px;"
          />
          <button class="button button--default" onClick={() => this.addChat()}>
            {$t('Go')}
          </button>
        </div>
        <ul class={styles.selectedFriends}>
          {this.selectedFriends.map(friend => (
            <li key={friend.id} onClick={() => this.handleRemove(friend.id)}>
              {friend.name}
              <i class="icon-close" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  render() {
    return (
      <div class={styles.addChatContainer} styles="background: transparent;">
        <div class={styles.addChatContainer} onClick={() => this.$emit('closeAddChatModal')} />
        <div class={styles.addChatModal}>
          <h2>{$t('New Message')}</h2>
          <i
            class={cx('icon-close', styles.closeIcon)}
            onClick={() => this.$emit('closeAddChatModal')}
          />
          {this.selectedFriends.length > 1 && (
            <TextInput vModel={this.chatName} style="margin-bottom: 16px;" />
          )}
          {this.friendSearch}
          {this.friendList}
        </div>
      </div>
    );
  }
}
