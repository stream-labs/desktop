import cloneDeep from 'lodash/cloneDeep';
import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import { TextInput } from 'components/shared/inputs/inputs';
import styles from './CommunityHub.m.less';
import { $t, I18nService } from 'services/i18n';
import { Inject } from 'services';
import { CommunityHubService } from 'services/community-hub';

@Component({})
export default class AddChatModal extends TsxComponent<{ onCloseAddFriendModal: () => void }> {
  @Inject() communityHubService: CommunityHubService;
  @Inject() i18nService: I18nService;

  name = '';
  errorText = '';
  success = false;

  async addFriend() {
    if (this.success) return this.$emit('closeAddFriendModal');
    try {
      await this.communityHubService.sendFriendRequestByName(this.name);
      this.success = true;
    } catch (e) {
      this.errorText = e;
    }
  }

  render() {
    return (
      <div class={styles.addChatContainer} styles="background: transparent;">
        <div class={styles.addChatContainer} onClick={() => this.$emit('closeAddFriendModal')} />
        <div class={styles.addChatModal}>
          <h2>{this.success ? $t('Friend Request Sent') : $t('Add Friends')}</h2>
          <i
            class={cx('icon-close', styles.closeIcon)}
            onClick={() => this.$emit('closeAddFriendModal')}
          />
          {this.success && $t('Your friend request was sent successfully!')}
          {!this.success && <TextInput vModel={this.name} style="margin-bottom: 16px;" />}
          {this.errorText && <div>{this.errorText}</div>}
          <button class="button button--action" onClick={() => this.addFriend()}>
            {this.success ? $t('Ok') : $t('Send Friend Request')}
          </button>
        </div>
      </div>
    );
  }
}
