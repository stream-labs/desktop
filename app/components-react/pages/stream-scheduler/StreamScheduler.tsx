import React from 'react';
import { IStreamEvent } from '../../../services/streaming';
import moment, { Moment } from 'moment';
import Spinner from '../../shared/Spinner';
import css from './StreamScheduler.m.less';
import cx from 'classnames';
import { useGoLiveSettings } from '../../windows/go-live/useGoLiveSettings';
import { useOnCreate } from '../../hooks';
import { Calendar } from 'antd';

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
export default function StreamScheduler() {
  // get loading(): boolean {
  //   return !this.streamingService.state.streamEventsLoaded;
  // }
  //
  // get locale() {
  //   // settings like 'firstDayOfTheWeek' based on the current locale
  //   const id = this.i18nService.state.locale.split('-')[0];
  //   return {
  //     id,
  //     masks: { weekdays: 'WWWW' }, // display the full weekday name
  //   };
  // }
  //
  // private get streamingView() {
  //   return this.streamingService.views;
  // }
  //
  // created() {
  //   this.streamingService.actions.loadStreamEvents();
  // }
  //
  // private get calendarAttrs(): IAttribute[] {
  //   // convert events to the v-calendar-friendly format
  //   return this.streamingService.state.streamEvents.map((event, key) => {
  //     return {
  //       key,
  //       dates: new Date(event.date),
  //       customData: event,
  //     };
  //   });
  // }
  //
  // function showScheduleNewDialog(date: number) {
  //   const today = new Date().setHours(0, 0, 0, 0);
  //   const isPastDate = new Date(date).getTime() < today;
  //   if (isPastDate) {
  //     // WindowsService.showMessageBox(this, () => $t('You can not schedule to this date'));
  //   } else {
  //     // WindowsService.showModalDialog(this, () => <EditScheduledStream date={date} />);
  //   }
  // }
  //
  // function showUpdateDialog(event?: IStreamEvent) {
  //   // WindowsService.showModalDialog(this, () => <EditScheduledStream event={event} />);
  // }
  //
  // function renderDay(day: IDay, attributes: IAttribute[]) {
  //   // show maximum 3 events per day for now:
  //   attributes = attributes?.slice(0, 3);
  //   return (
  //     <div
  //       className={{ [css.daySlot]: true }}
  //       onClick={() => this.showScheduleNewDialog(day.date.valueOf())}
  //     >
  //       <span className={css.dayLabel}>{day.day}</span>
  //       <transition-group name="fade">
  //         {attributes?.map((attr: any) => this.renderEvent(attr.customData))}
  //       </transition-group>
  //     </div>
  //   );
  // }
  //
  // function renderEvent(event: IStreamEvent) {
  //   const time = moment(event.date).format('hh:ssa');
  //   return (
  //     <p
  //       key={event.id}
  //       className={{
  //         [css.event]: true,
  //         [css.eventFacebook]: event.platform === 'facebook',
  //         [css.eventYoutube]: event.platform === 'youtube',
  //       }}
  //       onClick={(e: Event) => {
  //         e.stopPropagation();
  //         this.showUpdateDialog(event);
  //       }}
  //     >
  //       <span className={css.eventTime}>{time}</span> &nbsp;
  //       <br />
  //       <span className={css.eventTitle}>{event.title}</span>
  //     </p>
  //   );
  // }

  const { streamEvents, loadStreamEvents } = useGoLiveSettings(undefined, { isScheduleMode: true });

  useOnCreate(() => {
    loadStreamEvents();
  });

  function renderEvent(event: IStreamEvent) {
    const time = moment(event.date).format('hh:ssa');
    return (
      <p
        key={event.id}
        className={cx({
          [css.event]: true,
          [css.eventFacebook]: event.platform === 'facebook',
          [css.eventYoutube]: event.platform === 'youtube',
        })}
        onClick={e => {
          alert(e);
        }}
      >
        <span className={css.eventTime}>{time}</span> &nbsp;
        <br />
        <span className={css.eventTitle}>{event.title}</span>
      </p>
    );
  }

  function renderDay(date: Moment) {
    console.log('render', date);
    const start = moment(date).startOf('day');
    const end = moment(date).endOf('day');
    const events = streamEvents.filter(ev => {
      return moment(ev.date).isBetween(start, end);
    });
    console.log(start, end, events);
    return <div>{events.map(renderEvent)}</div>;
  }

  return (
    <div className={cx(css.streamSchedulerPage)}>
      {/*<ul>*/}
      {/*  {streamEvents.map(ev => (*/}
      {/*    <li key={ev.id}>*/}
      {/*      {ev.platform} {ev.title} {ev.date}*/}
      {/*    </li>*/}
      {/*  ))}*/}
      {/*</ul>*/}
      Loaded {streamEvents.length} broadcasts
      <Calendar dateCellRender={renderDay} />
      Calendar is here
      {/*<Calendar*/}
      {/*  isExpanded={true}*/}
      {/*  locale={this.locale}*/}
      {/*  attributes={this.calendarAttrs}*/}
      {/*  scopedSlots={{*/}
      {/*    'day-content': (params: { day: IDay; attributes: IAttribute[] }) =>*/}
      {/*      this.renderDay(params.day, params.attributes),*/}
      {/*  }}*/}
      {/*/>*/}
      {/*{isLoading && (*/}
      {/*  <div className={css.loadingFader}>*/}
      {/*    <div className={css.loadingShadow}></div>*/}
      {/*    <Spinner className={css.spinner} />*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
}
