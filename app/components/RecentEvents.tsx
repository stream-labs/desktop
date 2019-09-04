import cx from 'classnames';
import moment from 'moment';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import { IRecentEvent, RecentEventsService } from 'services/recent-events';
import { Component, Prop } from 'vue-property-decorator';
import styles from './RecentEvents.m.less';
import TsxComponent from './tsx-component';

const getName = (event: IRecentEvent) => {
  if (event.gifter) return event.gifter;
  if (event.from) return event.from;
  return event.name;
};

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  @Inject() recentEventsService: RecentEventsService;

  queuePaused = false;

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
    this.$emit('popout');
    return this.recentEventsService.openRecentEventsWindow();
  }

  popoutMediaShare() {
    return this.recentEventsService.openRecentEventsWindow(true);
  }

  muteEvents() {
    return this.recentEventsService.toggleMuteEvents();
  }

  skipAlert() {
    return this.recentEventsService.skipAlert();
  }

  async toggleQueue() {
    try {
      this.queuePaused
        ? await this.recentEventsService.unpauseAlertQueue()
        : await this.recentEventsService.pauseAlertQueue();
      this.queuePaused = !this.queuePaused;
    } catch (e) {}
  }

  render(h: Function) {
    return (
      <div class={styles.container}>
        <Toolbar
          popoutMediaShare={() => this.popoutMediaShare()}
          popoutRecentEvents={() => this.popoutRecentEvents()}
          muteEvents={() => this.muteEvents()}
          skipAlert={() => this.skipAlert()}
          toggleQueue={() => this.toggleQueue()}
          queuePaused={this.queuePaused}
          muted={this.muted}
        />
        <div class={styles.eventContainer}>
          {!!this.recentEvents.length &&
            this.recentEvents.map(event => (
              <EventCell
                key={event.id.toString()}
                event={event}
                repeatAlert={this.repeatAlert.bind(this)}
                eventString={this.eventString.bind(this)}
              />
            ))}
          {this.recentEvents.length === 0 && (
            <div class={styles.empty}>{$t('There are no events to display')}</div>
          )}
        </div>
      </div>
    );
  }
}

interface IToolbarProps {
  popoutMediaShare: Function;
  popoutRecentEvents: Function;
  muteEvents: Function;
  skipAlert: Function;
  toggleQueue: Function;
  queuePaused: boolean;
  muted: boolean;
}

// TODO: Refactor into stateless functional component
@Component({})
class Toolbar extends TsxComponent<IToolbarProps> {
  @Prop() popoutMediaShare: () => void;
  @Prop() popoutRecentEvents: () => void;
  @Prop() muteEvents: () => void;
  @Prop() skipAlert: () => void;
  @Prop() toggleQueue: () => void;
  @Prop() queuePaused: boolean;
  @Prop() muted: boolean;

  render(h: Function) {
    const pauseTooltip = this.queuePaused ? $t('Pause Alert Queue') : $t('Unpause Alert Queue');
    return (
      <div class={styles.topBar}>
        <h2 class="studio-controls__label">{$t('Mini Feed')}</h2>
        <span class="action-icon" onClick={this.popoutRecentEvents}>
          <i class="icon-pop-out-2" />
          <span style={{ marginLeft: '8px' }}>Pop Out Full Events View</span>
        </span>
        <i
          class="icon-music action-icon"
          onClick={this.popoutMediaShare}
          v-tooltip={{ content: $t('Popout Media Share Controls'), placement: 'bottom' }}
        />
        <i
          class={`${this.queuePaused ? 'icon-media-share-2' : 'icon-pause'} action-icon`}
          onClick={this.toggleQueue}
          v-tooltip={{ content: pauseTooltip, placement: 'bottom' }}
        />
        <i
          class="icon-skip action-icon"
          onClick={this.skipAlert}
          v-tooltip={{ content: $t('Skip Alert'), placement: 'bottom' }}
        />
        <i
          class={cx('icon-mute action-icon', { [styles.red]: this.muted })}
          onClick={this.muteEvents}
          v-tooltip={{ content: $t('Mute Event Sounds'), placement: 'bottom' }}
        />
      </div>
    );
  }
}

const classForType = (event: IRecentEvent) => {
  if (event.type === 'sticker' || event.type === 'effect') return event.currency;
  if (event.type === 'superchat' || event.formatted_amount) return 'donation';
  return event.type;
};

const amountString = (event: IRecentEvent) => {
  if (event.formatted_amount) return event.formatted_amount;
  if (event.type === 'superchat') return event.displayString;
  if (event.type === 'sticker' || event.type === 'effect') {
    return `${event.amount} ${event.currency}`;
  }
  return `${event.amount} ${event.type}`;
};

// TODO: Refactor into stateless functional component
@Component({})
class EventCell extends TsxComponent<{
  event: IRecentEvent;
  eventString: (event: IRecentEvent) => string;
  repeatAlert: (event: IRecentEvent) => void;
}> {
  @Prop() event: IRecentEvent;
  @Prop() eventString: (event: IRecentEvent) => string;
  @Prop() repeatAlert: (event: IRecentEvent) => void;

  timestamp = '';
  timestampInterval: number;

  mounted() {
    this.updateTimestamp();

    this.timestampInterval = window.setInterval(() => {
      this.updateTimestamp();
    }, 60 * 1000);
  }

  destroyed() {
    if (this.timestampInterval) clearInterval(this.timestampInterval);
  }

  updateTimestamp() {
    this.timestamp = moment.utc(this.createdAt).fromNow(true);
  }

  get createdAt(): moment.Moment {
    if (this.event.iso8601Created) {
      return moment(this.event.iso8601Created);
    }

    return moment.utc(this.event.created_at);
  }

  render(h: Function) {
    console.log(this.event);

    return (
      <div class={styles.cell}>
        <span class={styles.timestamp}>{this.timestamp}</span>
        <span class={styles.name}>{getName(this.event)}</span>
        <span>{this.eventString(this.event)}</span>
        {this.event.gifter && (
          <span class={styles.name}>{this.event.from ? this.event.from : this.event.name}</span>
        )}
        {this.event.amount && (
          <span class={styles[classForType(this.event)]}>{amountString(this.event)}</span>
        )}
        {(this.event.comment || this.event.message) && (
          <span class={styles.whisper}>
            {this.event.comment ? this.event.comment : this.event.message}
          </span>
        )}
        <i
          class="icon-repeat action-icon"
          onClick={() => this.repeatAlert(this.event)}
          v-tooltip={{ content: $t('Repeat Alert'), placement: 'left' }}
        />
      </div>
    );
  }
}
