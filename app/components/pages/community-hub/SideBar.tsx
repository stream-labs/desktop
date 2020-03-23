import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';

@Component({})
export default class SideBar extends TsxComponent {
  render() {
    return (
      <div class={styles.sidebar}>
        <span class={styles.mainTab}>
          <i class="icon-media-share-3" />
          {$t('Matchmaking')}
        </span>
        <span class={styles.mainTab}>
          <i class="icon-team-2" />
          {$t('Friends')}
        </span>
        <span class={styles.chatHeader}>
          {$t('Group Chats')}
          <i class="icon-add-circle" />
        </span>
        <span class={styles.chatHeader}>
          {$t('Direct Messages')}
          <i class="icon-add-circle" />
        </span>
      </div>
    );
  }
}
