import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata, IListOption } from 'components/shared/inputs';

@Component({})
export default class MatchmakeForm extends TsxComponent {
  selectedCategories: Array<IListOption<string>> = [];
  selectedTags: Array<IListOption<string>> = [];
  roomSize: number = 2;

  stubTags = [
    { description: 'tag1', value: 'tag1', title: 'tag1' },
    { description: 'tag2', value: 'tag2', title: 'tag2' },
    { description: 'tag3', value: 'tag3', title: 'tag3' },
    { description: 'tag4', value: 'tag4', title: 'tag4' },
    { description: 'tag5', value: 'tag5', title: 'tag5' },
  ];

  render() {
    return (
      <div class={styles.matchmakeFormContainer}>
        <img src={require('../../../../media/images/community-hub/matchmake.png')} />
        <h2>{$t('Meet other streamers to connect with!')}</h2>
        <ValidatedForm class={styles.matchmakeDropdowns}>
          <VFormGroup
            vModel={this.selectedCategories}
            metadata={metadata.tags({ title: $t('I Like to Play'), options: this.stubTags })}
          />
          <VFormGroup
            style="margin-left: 24px;"
            vModel={this.roomSize}
            metadata={metadata.number({
              min: 2,
              max: 6,
              title: $t('Max Room Size'),
              description: $t('2-6 people per room'),
              isInteger: true,
            })}
          />
        </ValidatedForm>
        <div class={styles.matchmakeDropdowns}>
          <VFormGroup
            value={this.selectedTags}
            metadata={metadata.tags({ title: $t('I Want to Talk About'), options: this.stubTags })}
          />
        </div>
        <button class={cx('button button--action', styles.matchmakeButton)}>
          {$t('Matchmake')}
        </button>
      </div>
    );
  }
}
