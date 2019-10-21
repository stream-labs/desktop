import { Component, Prop } from 'vue-property-decorator';
import { IInputMetadata, IListOption } from '../../shared/inputs';
import { ListInput } from 'components/shared/inputs/inputs';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import { IYoutubeLiveBroadcast } from '../../../services/platforms/youtube';
import { $t } from '../../../services/i18n';
import * as moment from 'moment';
import styles from './BroadcastInput.m.less';
import cx from 'classnames';

interface IBroadcastInputMetadata extends IInputMetadata {
  broadcasts: IYoutubeLiveBroadcast[];
}

/**
 * Youtube broadcast-selector input
 */
@Component({ components: { ListInput } })
export default class BroadcastInput extends BaseInput<string, IBroadcastInputMetadata> {
  @Prop() readonly value: string;
  @Prop() readonly metadata: IBroadcastInputMetadata;
  @Prop() readonly title: string;

  get listInputMetadata() {
    // prepare data for the nested list-input
    const newBroadCastOption = {
      title: $t('Create New Event'),
      value: '',
    };
    return {
      ...this.options,
      options: [
        newBroadCastOption,
        ...this.options.broadcasts.map(broadcast => ({
          value: broadcast.id,
          title: `${broadcast.snippet.title} (${this.formatDate(
            broadcast.snippet.scheduledStartTime,
          )})`,
        })),
      ],
    };
  }

  /**
   * format the isoDate to the locale-dependent format
   */
  formatDate(isoDate: string): string {
    return moment(new Date(isoDate)).format(moment.localeData().longDateFormat('ll'));
  }

  render() {
    // define custom slot for the list-item
    const scopedSlots = {
      item: (props: { option: IListOption<string> }) => {
        const broadcast = this.options.broadcasts.find(
          broadcast => broadcast.id === props.option.value,
        );

        // "Create New" option
        if (!broadcast) {
          return (
            <div class={cx(styles['new-broadcast'], styles.broadcast)}>
              <div class={styles['col-image']}>
                <div>
                  <i class="fa fa-plus" />
                </div>
              </div>
              <div class={styles['col-description']}>
                <div>{$t('Create New Event')}</div>
              </div>
            </div>
          );
        }

        // Regular options
        return (
          <div class={styles.broadcast}>
            <div class={styles['col-image']}>
              <img src={broadcast.snippet.thumbnails.default.url} />
            </div>
            <div class={styles['col-description']}>
              <div>{broadcast.snippet.title}</div>
              <div>{broadcast.snippet.description}</div>
            </div>
            <div class={styles['col-date']}>
              <div>{this.formatDate(broadcast.snippet.scheduledStartTime)}</div>
            </div>
          </div>
        );
      },
    };

    // render customized ListInput
    return (
      <ListInput
        class={styles['broadcast-input']}
        value={this.value}
        metadata={this.listInputMetadata}
        onInput={(value: any, event: any) => this.emitInput(value, event)}
        scopedSlots={scopedSlots}
      />
    );
  }
}
