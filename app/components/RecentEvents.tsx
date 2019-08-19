import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import moment from 'moment';
import { RecentEventsService } from 'services/recent-events';
import TsxComponent from './tsx-component';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import styles from './RecentEvents.m.less';

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  @Inject() recentEventsService: RecentEventsService;

  get recentEvents() {
    return this.recentEventsService.state.recentEvents;
  }

  formatMoney(amount: string, type: string) {
    const prefix = type === 'donation' ? '$' : '';
    const numAmount = Number.parseFloat(amount);
    return `${prefix}${type === 'donation' ? numAmount.toFixed(2) : numAmount.toFixed(0)}`;
  }

  render(h: Function) {
    return (
      <div class={styles.container}>
        <div class={styles.topBar}>
          <h2 class="studio-controls__label">{$t('Recent Events')}</h2>
        </div>
        <div class={styles.eventContainer}>
          {this.recentEvents &&
            this.recentEvents.map(event => (
              <div class={styles.cell}>
                <span class={styles.timestamp}>{moment(event.created_at).fromNow(true)}</span>
                <span>{event.from}</span>
                <span>{event.type}</span>
                {event.amount && (
                  <span class={styles.money}>{this.formatMoney(event.amount, event.type)}</span>
                )}
                {event.message && <span class={styles.whisper}>{event.message}</span>}
                <i class="icon-reset" />
              </div>
            ))}
        </div>
      </div>
    );
  }
}
