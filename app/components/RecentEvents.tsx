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
    return this.recentEventsService.state.recentEvents;
  }

  get muted() {
    return this.recentEventsService.state.muted;
  }

  formatMoney(amount: string, type: string) {
    const prefix = type === 'donation' ? '$' : '';
    const numAmount = Number.parseFloat(amount);
    return `${prefix}${type === 'donation' ? numAmount.toFixed(2) : numAmount.toFixed(0)}`;
  }

  eventString(event: IRecentEvent) {
    return this.recentEventsService.getEventString(event);
  }

  repeatAlert(event: IRecentEvent) {
    return this.recentEventsService.repeatAlert(event);
  }

  popoutRecentEvents() {
    return this.recentEventsService.openRecentEventsWindow();
  }

  popoutMediaShare() {
    return this.recentEventsService.openRecentEventsWindow(true);
  }

  muteEvents() {
    return this.recentEventsService.toggleMuteEvents();
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
          <i class="icon-music action-icon" onClick={() => this.popoutMediaShare()} />
          <i class="icon-pop-out-2 action-icon" onClick={() => this.popoutRecentEvents()} />
          <i class="icon-pause action-icon" onClick={() => this.popoutRecentEvents()} />
          <i class="icon-skip action-icon" onClick={() => this.popoutRecentEvents()} />
          <i
            class={cx('icon-mute action-icon', { [styles.red]: this.muted })}
            onClick={() => this.muteEvents()}
          />
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
                <i class="icon-repeat action-icon" onClick={() => this.repeatAlert(event)} />
              </div>
            ))}
        </div>
      </div>
    );
  }
}
