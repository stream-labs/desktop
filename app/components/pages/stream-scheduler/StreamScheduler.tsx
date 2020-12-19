import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { Calendar } from 'v-calendar';
import css from './StreamScheduler.m.less';
import { Inject } from 'services/core';
import { $t, I18nService } from 'services/i18n';
import { TPlatform } from 'services/platforms';
import moment from 'moment';
import { IYoutubeLiveBroadcast, YoutubeService } from 'services/platforms/youtube';
import { FacebookService, IFacebookLiveVideo } from 'services/platforms/facebook';
import { StreamingService, WindowsService } from 'app-services';
import { Spinner } from 'streamlabs-beaker';
import EditScheduledStream from './EditScheduledStream';
import cx from 'classnames';
import { IStreamEvent } from 'services/streaming';

interface IDay {
  day: number;
  date: Date;
}

interface IAttribute {
  key: number;
  customData: IStreamEvent;
  dates: Date;
}

/**
 * StreamScheduler page
 */
@Component({})
export default class StreamScheduler extends TsxComponent {
  @Inject() private i18nService: I18nService;
  @Inject() private streamingService: StreamingService;
  @Inject() private youtubeService: YoutubeService;
  @Inject() private facebookService: FacebookService;
  @Inject() private windowsService: WindowsService;

  get loading(): boolean {
    return !this.streamingService.state.streamEventsLoaded;
  }

  get locale() {
    // settings like 'firstDayOfTheWeek' based on the current locale
    const id = this.i18nService.state.locale.split('-')[0];
    return {
      id,
      masks: { weekdays: 'WWWW' }, // display the full weekday name
    };
  }

  private get streamingView() {
    return this.streamingService.views;
  }

  created() {
    this.streamingService.actions.loadStreamEvents();
  }

  private get calendarAttrs(): IAttribute[] {
    // convert events to the v-calendar-friendly format
    return this.streamingService.state.streamEvents.map((event, key) => {
      return {
        key,
        dates: new Date(event.date),
        customData: event,
      };
    });
  }

  private showScheduleNewDialog(date: number) {
    const today = new Date().setHours(0, 0, 0, 0);
    const isPastDate = new Date(date).getTime() < today;
    if (isPastDate) {
      WindowsService.showMessageBox(this, () => $t('You can not schedule to this date'));
    } else {
      WindowsService.showModalDialog(this, () => <EditScheduledStream date={date} />);
    }
  }

  private showUpdateDialog(event?: IStreamEvent) {
    WindowsService.showModalDialog(this, () => <EditScheduledStream event={event} />);
  }

  private renderDay(day: IDay, attributes: IAttribute[]) {
    // show maximum 3 events per day for now:
    attributes = attributes?.slice(0, 3);
    return (
      <div
        class={{ [css.daySlot]: true }}
        onClick={() => this.showScheduleNewDialog(day.date.valueOf())}
      >
        <span class={css.dayLabel}>{day.day}</span>
        <transition-group name="fade">
          {attributes?.map((attr: any) => this.renderEvent(attr.customData))}
        </transition-group>
      </div>
    );
  }

  private renderEvent(event: IStreamEvent) {
    const time = moment(event.date).format('hh:ssa');
    return (
      <p
        key={event.id}
        class={{
          [css.event]: true,
          [css.eventFacebook]: event.platform === 'facebook',
          [css.eventYoutube]: event.platform === 'youtube',
        }}
        onClick={(e: Event) => {
          e.stopPropagation();
          this.showUpdateDialog(event);
        }}
      >
        <span class={css.eventTime}>{time}</span> &nbsp;
        <br />
        <span class={css.eventTitle}>{event.title}</span>
      </p>
    );
  }

  render() {
    return (
      <div class={cx(css.streamSchedulerPage)}>
        <Calendar
          isExpanded={true}
          locale={this.locale}
          attributes={this.calendarAttrs}
          scopedSlots={{
            'day-content': (params: { day: IDay; attributes: IAttribute[] }) =>
              this.renderDay(params.day, params.attributes),
          }}
        />
        {this.loading && (
          <div class={css.loadingFader}>
            <div class={css.loadingShadow}></div>
            <Spinner class={css.spinner} />
          </div>
        )}
      </div>
    );
  }
}
