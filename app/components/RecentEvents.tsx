import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import moment from 'moment';
import { RecentEventsService, IRecentEvent } from 'services/recent-events';
import TsxComponent from './tsx-component';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';
import styles from './RecentEvents.m.less';
import BrowserView from 'components/shared/BrowserView';
import { UserService } from 'services/user';
import electron from 'electron';
import { NavigationService } from 'services/navigation';
import { CustomizationService } from 'services/customization';

const getName = (event: IRecentEvent) => {
  if (event.gifter) return event.gifter;
  if (event.from) return event.from;
  return event.name;
};

@Component({})
export default class RecentEvents extends TsxComponent<{}> {
  @Inject() recentEventsService: RecentEventsService;
  @Inject() userService: UserService;
  @Inject() navigationService: NavigationService;
  @Inject() customizationService: CustomizationService;

  queuePaused = false;
  eventsCollapsed = false;

  get native() {
    return !this.customizationService.state.legacyEvents;
  }

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

  setNative(native: boolean) {
    if (!native && this.customizationService.state.eventsSize < 250) {
      // Switch to a reasonably sized events feed
      this.customizationService.setSettings({ eventsSize: 250 });
    }

    this.customizationService.setSettings({ legacyEvents: !native });
  }

  handleBrowserViewReady(view: Electron.BrowserView) {
    if (view.isDestroyed()) return;

    electron.ipcRenderer.send('webContents-preventPopup', view.webContents.id);

    view.webContents.on('new-window', (e, url) => {
      const match = url.match(/dashboard\/([^\/^\?]*)/);

      if (match && match[1] === 'recent-events') {
        this.popoutRecentEvents();
      } else if (match) {
        this.navigationService.navigate('Dashboard', {
          subPage: match[1],
        });
      } else {
        electron.remote.shell.openExternal(url);
      }
    });
  }

  renderNativeEvents(h: Function) {
    return (
      <div class={styles.eventContainer}>
        {!!this.recentEvents.length &&
          this.recentEvents.map(event => (
            <EventCell
              event={event}
              repeatAlert={this.repeatAlert.bind(this)}
              eventString={this.eventString.bind(this)}
            />
          ))}
        {this.recentEvents.length === 0 && (
          <div class={styles.empty}>{$t('There are no events to display')}</div>
        )}
      </div>
    );
  }

  renderEmbeddedEvents(h: Function) {
    return (
      <BrowserView
        class={styles.eventContainer}
        src={this.userService.recentEventsUrl()}
        setLocale={true}
        onReady={view => this.handleBrowserViewReady(view)}
      />
    );
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
          native={this.native}
          onNativeswitch={val => this.setNative(val)}
        />
        {this.native ? this.renderNativeEvents(h) : this.renderEmbeddedEvents(h)}
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
  native: boolean;
  onNativeswitch: (native: boolean) => void;
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
  @Prop() native: boolean;

  render(h: Function) {
    const pauseTooltip = this.queuePaused ? $t('Pause Alert Queue') : $t('Unpause Alert Queue');
    return (
      <div class={styles.topBar}>
        <h2 class="studio-controls__label">{$t('Mini Feed')}</h2>
        <span class="action-icon" onClick={() => this.$emit('nativeswitch', !this.native)}>
          <i class="icon-live-dashboard" />
          <span style={{ marginLeft: '8px' }}>
            {this.native ? 'Switch to Legacy Events View' : 'Switch to New Events View'}
          </span>
        </span>
        {/* <span class="action-icon" onClick={this.popoutRecentEvents}>
          <i class="icon-pop-out-2" />
          <span style={{ marginLeft: '8px' }}>Pop Out Full Events View</span>
        </span> */}
        {this.native && (
          <i
            class="icon-music action-icon"
            onClick={this.popoutMediaShare}
            v-tooltip={{ content: $t('Popout Media Share Controls'), placement: 'bottom' }}
          />
        )}
        {this.native && (
          <i
            class={`${this.queuePaused ? 'icon-media-share-2' : 'icon-pause'} action-icon`}
            onClick={this.toggleQueue}
            v-tooltip={{ content: pauseTooltip, placement: 'bottom' }}
          />
        )}
        {this.native && (
          <i
            class="icon-skip action-icon"
            onClick={this.skipAlert}
            v-tooltip={{ content: $t('Skip Alert'), placement: 'bottom' }}
          />
        )}
        {this.native && (
          <i
            class={cx('icon-mute action-icon', { [styles.red]: this.muted })}
            onClick={this.muteEvents}
            v-tooltip={{ content: $t('Mute Event Sounds'), placement: 'bottom' }}
          />
        )}
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

  render(h: Function) {
    return (
      <div class={styles.cell}>
        <span class={styles.timestamp}>{moment(this.event.created_at).fromNow(true)}</span>
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
