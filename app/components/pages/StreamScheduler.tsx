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
import cx from 'classnames';
import { scheduleStream } from '../../../test/helpers/spectron/streaming';

interface IStreamEvent {
  id: string;
  platform: TPlatform;
  status: 'completed' | 'scheduled';
  title: string;
  date: Date;
}

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

  private ytEvents: IYoutubeLiveBroadcast[] = [];
  private fbEvents: IFacebookLiveVideo[] = [];
  private attributes: IAttribute[] = [];
  private loading = true;

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
    this.loadEvents();
    this.streamingService.streamScheduled.subscribe(() => this.loadEvents());
  }

  private async loadEvents() {
    // load fb and yt events simultaneously
    this.loading = true;
    const events: IStreamEvent[] = [];
    await Promise.all([this.loadFbEvents(), this.loadYTBEvents()]);

    // convert fb and yt events to the unified IStreamEvent format
    this.ytEvents.forEach(ytEvent => {
      const platform = 'youtube';
      const id = ytEvent.id;
      const date = new Date(ytEvent.snippet.scheduledStartTime || ytEvent.snippet.actualStartTime);
      const title = ytEvent.snippet.title;
      const status = ytEvent.status.lifeCycleStatus === 'complete' ? 'completed' : 'scheduled';
      events.push({ id, platform, date, title, status });
    });

    this.fbEvents.forEach(fbEvent => {
      const platform = 'facebook';
      const id = fbEvent.id;
      const date = new Date(fbEvent.planned_start_time || fbEvent.broadcast_start_time);
      const title = fbEvent.title;
      const status = 'scheduled';
      events.push({ id, platform, date, title, status });
    });

    // convert events to the v-calendar-friendly format
    this.attributes = events.map((event, key) => {
      return {
        key,
        dates: event.date,
        customData: event,
      };
    });
    this.loading = false;
  }

  private async loadYTBEvents(): Promise<void> {
    if (!this.streamingView.isPlatformLinked('youtube')) return;
    this.ytEvents = await this.youtubeService.actions.return.fetchBroadcasts();
  }

  private async loadFbEvents() {
    if (!this.streamingView.isPlatformLinked('facebook')) return;
    this.fbEvents = await this.facebookService.actions.return.fetchAllVideos();
  }

  private showScheduleNewDialog(date: Date) {
    this.windowsService.showWindow({
      componentName: 'ScheduleStreamWindow',
      title: $t('Schedule Stream'),
      size: { width: 800, height: 670 },
      queryParams: {
        date: date.valueOf(),
      },
    });
  }

  private showUpdateDialog(event?: IStreamEvent) {
    this.windowsService.showWindow({
      componentName: 'ScheduleStreamWindow',
      title: $t('Update Stream'),
      size: { width: 800, height: 670 },
      queryParams: {
        platform: event.platform,
        id: event.id,
        date: event.date.valueOf(),
      },
    });
  }

  private renderDay(day: IDay, attributes: IAttribute[]) {
    // show maximum 3 events per day for now TODO:
    attributes = attributes?.slice(0, 3);
    return (
      <div class={css.daySlot} onClick={() => this.showScheduleNewDialog(day.date)}>
        <span class={css.dayLabel}>{day.day}</span>
        <div>{attributes?.map((attr: any) => this.renderEvent(attr.customData, day.date))}</div>
      </div>
    );
  }

  private renderEvent(event: IStreamEvent, date: Date) {
    const time = moment(date).format('hh:ssa');
    return (
      <p
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
          attributes={this.attributes}
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
