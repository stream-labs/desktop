import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import moment from 'moment';
import { RecentEventsService, IRecentEvent } from 'services/recent-events';
import TsxComponent from './tsx-component';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import styles from './RecentEvents.m.less';

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  @Inject() recentEventsService: RecentEventsService;

  get recentEvents() {
    console.log(this.recentEventsService.state.recentEvents);
    return this.recentEventsService.state.recentEvents;
  }

  formatMoney(amount: string, type: string) {
    const prefix = type === 'donation' ? '$' : '';
    const numAmount = Number.parseFloat(amount);
    return `${prefix}${type === 'donation' ? numAmount.toFixed(2) : numAmount.toFixed(0)}`;
  }

  eventString(event: IRecentEvent) {
    return this.recentEventsService.getEventString(event);
  }

  getName(event: IRecentEvent) {
    if (event.gifter) return event.gifter;
    if (event.from) return event.from;
    return event.name;
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
                <span class={styles.name}>{this.getName(event)}</span>
                <span>{this.eventString(event)}</span>
                {event.gifter && (
                  <span class={styles.name}>{event.from ? event.from : event.name}</span>
                )}
                {event.formatted_amount && (
                  <span class={styles.money}>{event.formatted_amount}</span>
                )}
                {(event.comment || event.message) && (
                  <span class={styles.whisper}>
                    {event.comment ? event.comment : event.message}
                  </span>
                )}
                <i class="icon-reset" />
              </div>
            ))}
        </div>
      </div>
    );
  }
}
