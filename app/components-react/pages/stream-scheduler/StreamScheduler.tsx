import React from 'react';
import { IStreamEvent } from '../../../services/streaming';
import moment, { Moment } from 'moment';
import Spinner from '../../shared/Spinner';
import css from './StreamScheduler.m.less';
import cx from 'classnames';
import { useStreamScheduler } from '../../windows/go-live/useGoLiveSettings';
import { useOnCreate } from '../../hooks';
import { Button, Calendar, Modal } from 'antd';
import { YoutubeEditStreamInfo } from '../../windows/go-live/platforms/YoutubeEditStreamInfo';
import { $t } from '../../../services/i18n';
import FacebookEditStreamInfo from '../../windows/go-live/platforms/FacebookEditStreamInfo';
import { ListInput } from '../../shared/inputs';
import Form from '../../shared/inputs/Form';


/**
 * StreamScheduler page
 */
export default function StreamScheduler() {

  // function showScheduleNewDialog(date: number) {
  //   const today = new Date().setHours(0, 0, 0, 0);
  //   const isPastDate = new Date(date).getTime() < today;
  //   if (isPastDate) {
  //     // WindowsService.showMessageBox(this, () => $t('You can not schedule to this date'));
  //   } else {
  //     // WindowsService.showModalDialog(this, () => <EditScheduledStream date={date} />);
  //   }
  // }

  const {
    contextValue,
    Context: StreamSchedulerContext,
    streamEvents,
    loadStreamEvents,
    isStreamEventModalVisible,
    closeEventModal,
    submitEvent,
    showNewEventModal,
    showEditEventModal,
    selectedPlatform,
    getPlatformDisplayName,
    platformsWithScheduler,
  } = useStreamScheduler();

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
        onClick={ev => {
          ev.stopPropagation();
          showEditEventModal(event.id);
        }}
      >
        <span className={css.eventTime}>{time}</span> &nbsp;
        <br />
        <span className={css.eventTitle}>{event.title}</span>
      </p>
    );
  }

  function renderDay(date: Moment) {
    const start = moment(date).startOf('day');
    const end = moment(date).endOf('day');
    const events = streamEvents
      .filter(ev => {
        return moment(ev.date).isBetween(start, end);
      })
      .slice(0, 3); // show max 3 events;

    return <div>{events.map(renderEvent)}</div>;
  }

  function onDaySelectHandler(date: Moment) {
    showNewEventModal();
  }

  return (
    <StreamSchedulerContext.Provider value={contextValue}>
      <div className={cx(css.streamSchedulerPage)}>
        Loaded {streamEvents.length} broadcasts
        <Calendar dateCellRender={renderDay} onSelect={onDaySelectHandler} />
        {/*<Button onClick={() => showNewEventModal()}>Open modal</Button>*/}
        {/*<Button onClick={closeEventModal}>Close modal</Button>*/}
        <Modal
          title={$t('Schedule Stream')}
          visible={isStreamEventModalVisible}
          onOk={submitEvent}
          onCancel={closeEventModal}
          destroyOnClose={true}
          forceRender
        >
          <Form>
            <ListInput
              label={$t('Platform')}
              value={selectedPlatform}
              options={platformsWithScheduler.map(platform => ({
                value: platform,
                label: getPlatformDisplayName(platform),
              }))}
              onChange={showNewEventModal}
            />
            {selectedPlatform === 'youtube' && <YoutubeEditStreamInfo />}
            {selectedPlatform === 'facebook' && <FacebookEditStreamInfo />}
          </Form>
        </Modal>
        {/*{isLoading && (*/}
        {/*  <div className={css.loadingFader}>*/}
        {/*    <div className={css.loadingShadow}></div>*/}
        {/*    <Spinner className={css.spinner} />*/}
        {/*  </div>*/}
        {/*)}*/}
      </div>
    </StreamSchedulerContext.Provider>
  );
}
