import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import styles from './CommunityHub.m.less';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata, IListOption } from 'components/shared/inputs';
import { categoryTags, conversationTags } from 'services/community-hub/tag-data';
import { Inject } from 'services';
import { LiveChatService } from 'services/community-hub/live-chat';

@Component({})
export default class MatchmakeForm extends TsxComponent {
  @Inject() liveChatService: LiveChatService;

  roomSize: number = 2;

  selectedTags = {
    category: [] as Array<IListOption<string>>,
    conversation: [] as Array<IListOption<string>>,
  };

  handleTagSelect(key: string, tags: any) {
    this.selectedTags[key] = tags;
  }

  get validTags() {
    const catLength = this.selectedTags.category.length;
    const convLength = this.selectedTags.conversation.length;
    return catLength > 2 && convLength > 2;
  }

  handleSubmit() {
    if (!this.validTags) return;
    const game = this.selectedTags.category[0].value;
    const tags = [...this.selectedTags.category.slice(1), ...this.selectedTags.conversation];
    const tagValues = tags.map(tag => tag.value);
    this.liveChatService.matchmake(game, tagValues, this.roomSize);
  }

  render() {
    return (
      <div class={styles.matchmakeFormContainer}>
        <img src={require('../../../../media/images/community-hub/matchmake.png')} />
        <h2>{$t('Meet other streamers to connect with!')}</h2>
        <ValidatedForm class={styles.matchmakeDropdowns}>
          <VFormGroup
            metadata={metadata.tags({ title: $t('I Like to Stream...'), options: categoryTags() })}
            onInput={(tags: any) => this.handleTagSelect('category', tags)}
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
            metadata={metadata.tags({
              title: $t('I Want to Talk About...'),
              options: conversationTags(),
            })}
            onInput={(tags: any) => this.handleTagSelect('conversation', tags)}
          />
        </div>
        <button class={cx('button button--action', styles.matchmakeButton)}>
          {$t('Matchmake')}
        </button>
      </div>
    );
  }
}
