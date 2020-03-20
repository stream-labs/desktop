import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';

@Component({})
export default class MatchmakeForm extends TsxComponent {
  render() {
    return (
      <div class={styles.matchmakeFormContainer}>
        <img src={require('../../../../media/images/community-hub/matchmake.png')} />
        <h2>{$t('Find other streamers to play with in real time!')}</h2>
        <ValidatedForm class={styles.matchmakeDropdowns}>
          <VFormGroup metadata={metadata.list({ options: [], title: $t('Game') })} />
          <VFormGroup metadata={metadata.list({ options: [], title: $t('Platform') })} />
          <VFormGroup
            metadata={metadata.number({
              min: 2,
              max: 6,
              title: $t('Max Room Size'),
              description: $t('2-6 people per room'),
            })}
          />
        </ValidatedForm>
        <button class={cx('button button--action', styles.matchmakeButton)}>
          {$t('Matchmake')}
        </button>
      </div>
    );
  }
}
