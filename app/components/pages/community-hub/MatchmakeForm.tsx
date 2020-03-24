import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';

@Component({})
export default class MatchmakeForm extends TsxComponent {
  render() {
    return (
      <div class={styles.matchmakeFormContainer}>
        <img src={require('../../../../media/images/community-hub/matchmake.png')} />
        <h2>{$t('Meet other streamers to connect with!')}</h2>
        <button class={cx('button button--action', styles.matchmakeButton)}>
          {$t('Matchmake')}
        </button>
      </div>
    );
  }
}
