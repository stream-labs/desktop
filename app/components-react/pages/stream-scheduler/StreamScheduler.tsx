import React from 'react';
import { IGoLiveSettings, IStreamEvent } from '../../../services/streaming';
import moment, { Moment } from 'moment';
import Spinner from '../../shared/Spinner';
import css from './StreamScheduler.m.less';
import cx from 'classnames';
import { Button, Calendar, message, Modal } from 'antd';
import { YoutubeEditStreamInfo } from '../../windows/go-live/platforms/YoutubeEditStreamInfo';
import { $t } from '../../../services/i18n';
import FacebookEditStreamInfo from '../../windows/go-live/platforms/FacebookEditStreamInfo';
import { createBinding, ListInput, SwitchInput } from '../../shared/inputs';
import Form, { useForm } from '../../shared/inputs/Form';
import { mutation } from '../../store';
import { Services } from '../../service-provider';
import { useModule } from '../../hooks/useModule';
import {getPlatformService, TPlatform} from '../../../services/platforms';
import {
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
} from '../../../services/platforms/youtube';
import {
  IFacebookLiveVideoExtended,
  IFacebookStartStreamOptions,
} from '../../../services/platforms/facebook';
import {
  IPlatformComponentParams,
  TLayoutMode,
} from '../../windows/go-live/platforms/PlatformSettingsLayout';
import {assertIsDefined, getDefined} from '../../../util/properties-type-guards';

interface ISchedulerPlatformSettings extends Record<TPlatform, Object> {
  youtube: Partial<IYoutubeStartStreamOptions>;
  facebook: Partial<IFacebookStartStreamOptions>;
}

class StreamSchedulerModule {
  state = {
    isLoading: false,
    events: [] as IStreamEvent[],
    isModalVisible: false,
    selectedEventId: '',
    selectedPlatform: this.platforms[0],
    platformSettings: {
      youtube: {},
      facebook: {},
    } as ISchedulerPlatformSettings,
  };

  init() {
    this.loadEvents();
  }

  get streamingView() {
    return Services.StreamingService.views;
  }

  get selectedEvent() {
    return this.state.events.find(ev => this.state.selectedEventId === ev.id);
  }

  bindPlatform = {
    youtube: this.createPlatformBinding('youtube'),
    facebook: this.createPlatformBinding('facebook'),
  };

  private createPlatformBinding<T extends TPlatform>(platform: T) {
    const getValue = () =>
      this.state.platformSettings[platform] as Required<ISchedulerPlatformSettings[T]>;

    return {
      isScheduleMode: true,
      layoutMode: 'singlePlatform' as TLayoutMode,
      get value() {
        return getValue();
      },
      onChange: (newSettings: ISchedulerPlatformSettings[T]) => {
        this.updatePlatform(platform, newSettings);
      },
    };
  }

  private async loadEvents() {
    // load fb and yt events simultaneously
    this.reset();
    await Services.StreamingService.actions.return.prepopulateInfo();
    const events: IStreamEvent[] = [];
    const [fbEvents, ytEvents] = await Promise.all([this.loadFbEvents(), this.loadYTBEvents()]);

    // convert fb and yt events to the unified IStreamEvent format
    ytEvents.forEach(ytEvent => {
      events.push(convertYTBroadcastToEvent(ytEvent));
    });

    fbEvents.forEach(fbEvent => {
      events.push(convertFBLiveVideoToEvent(fbEvent));
    });
    this.setEvents(events);
  }

  private async loadYTBEvents() {
    if (!this.platforms.includes('youtube')) return [];
    return await Services.YoutubeService.actions.return.fetchBroadcasts();
  }

  private async loadFbEvents() {
    if (!this.platforms.includes('facebook')) return [];
    return await Services.FacebookService.actions.return.fetchAllVideos();
  }

  get platforms(): TPlatform[] {
    return this.streamingView.linkedPlatforms.filter(platform =>
      this.streamingView.supports('stream-schedule', [platform]),
    );
  }

  getPlatformDisplayName = this.streamingView.getPlatformDisplayName;

  submitEvent() {
    alert('Todo');
  }

  @mutation()
  showNewEventModal(platform: TPlatform) {
    this.state.selectedPlatform = platform;
    this.state.isModalVisible = true;
  }

  async showEditEventModal(eventId: string) {
    const event = getDefined(this.state.events.find(ev => eventId === ev.id));
    if (event.platform === 'youtube') {
      const ytSettings = await Services.YoutubeService.actions.return.fetchStartStreamOptionsForBroadcast(
        event.id,
      );
      this.SHOW_EDIT_EVENT_MODAL(event, ytSettings);
    } else {
      const fbDestination = getDefined(event.facebook);
      const fbSettings = await Services.FacebookService.actions.return.fetchStartStreamOptionsForVideo(
        event.id,
        fbDestination.destinationType,
        fbDestination.destinationId,
      );
      this.SHOW_EDIT_EVENT_MODAL(event, fbSettings);
    }
  }

  @mutation()
  private SHOW_EDIT_EVENT_MODAL(
    event: IStreamEvent,
    platformSettings: IYoutubeStartStreamOptions | IFacebookStartStreamOptions,
  ) {
    this.state.selectedEventId = event.id;
    this.state.selectedPlatform = event.platform;
    this.state.platformSettings[event.platform] = platformSettings;
    this.state.isModalVisible = true;
  }

  @mutation()
  closeModal() {
    this.state.selectedEventId = '';
    this.state.isModalVisible = false;
  }

  @mutation()
  private updatePlatform<T extends TPlatform>(platform: T, patch: ISchedulerPlatformSettings[T]) {
    Object.assign(this.state.platformSettings[platform], patch);
  }

  @mutation()
  private reset() {
    Object.assign(this.state, {
      isLoading: false,
      events: [],
    });
  }

  @mutation()
  private setEvents(events: IStreamEvent[]) {
    Object.assign(this.state, {
      isLoading: true,
      events,
    });
  }
}

/**
 * StreamScheduler page
 */
export default function StreamScheduler() {
  const {
    events,
    showNewEventModal,
    showEditEventModal,
    closeModal,
    isModalVisible,
    submitEvent,
    selectedEventId,
    selectedPlatform,
    getPlatformDisplayName,
    platforms,
    bindPlatform,
    module,
  } = useModule(StreamSchedulerModule).select();

  const form = useForm();

  // function showScheduleNewDialog(date: number) {
  //   const today = new Date().setHours(0, 0, 0, 0);
  //   const isPastDate = new Date(date).getTime() < today;
  //   if (isPastDate) {
  //     // WindowsService.showMessageBox(this, () => $t('You can not schedule to this date'));
  //   } else {
  //     // WindowsService.showModalDialog(this, () => <EditScheduledStream date={date} />);
  //   }
  // }

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
    const dayEvents = events
      .filter(ev => {
        return moment(ev.date).isBetween(start, end);
      })
      .slice(0, 3); // show max 3 events;

    return <div>{dayEvents.map(renderEvent)}</div>;
  }

  function onDaySelectHandler(date: Moment) {
    showNewEventModal(selectedPlatform);
  }

  async function validate() {
    try {
      await form.validateFields();
      return true;
    } catch (e: unknown) {
      message.error($t('Invalid settings. Please check the form'));
      return false;
    }
  }

  async function submit() {
    const valid = await validate();
    if (!valid) return;
    // const event = module.selectedEvent;
    // const service = getPlatformService(event.platform);
    // assertIsDefined(service.scheduleStream);
    // await service.scheduleStream(time, destinations[platform]);
  }

  function goLive() {}

  function remove() {}

  function renderFooter() {
    const canGoLive = true;
    return (
      <div>
        {/*/!* CLOSE BUTTON *!/*/}
        {/*<Button onClick={closeModal}>{$t('Close')}</Button>*/}

        {/* DELETE BUTTON */}
        <Button danger onClick={remove}>
          {$t('Delete')}
        </Button>

        {/* GO LIVE BUTTON */}
        {canGoLive && (
          <Button type="primary" onClick={goLive}>
            {$t('Go Live')}
          </Button>
        )}

        {/* SAVE BUTTON */}
        <Button onClick={submit}>{$t('Save')}</Button>
      </div>
    );
  }

  const canChangePlatform = !selectedEventId;

  return (
    <div className={cx(css.streamSchedulerPage)}>
      Loaded {events.length} broadcasts
      <Calendar dateCellRender={renderDay} onSelect={onDaySelectHandler} />
      {/*<Button onClick={() => showNewEventModal()}>Open modal</Button>*/}
      {/*<Button onClick={closeEventModal}>Close modal</Button>*/}
      <Modal
        title={$t('Schedule Stream')}
        visible={isModalVisible}
        onOk={submitEvent}
        onCancel={closeModal}
        destroyOnClose={true}
        footer={renderFooter()}
        forceRender
      >
        <Form>
          {canChangePlatform && (
            <ListInput
              label={$t('Platform')}
              value={selectedPlatform}
              options={platforms.map(platform => ({
                value: platform,
                label: getPlatformDisplayName(platform),
              }))}
              onChange={showNewEventModal}
            />
          )}

          {selectedPlatform === 'youtube' && <YoutubeEditStreamInfo {...bindPlatform.youtube} />}
          {selectedPlatform === 'facebook' && <FacebookEditStreamInfo {...bindPlatform.facebook} />}
        </Form>
      </Modal>
      {/*{isLoading && (*/}
      {/*  <div className={css.loadingFader}>*/}
      {/*    <div className={css.loadingShadow}></div>*/}
      {/*    <Spinner className={css.spinner} />*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
}

function convertYTBroadcastToEvent(ytBroadcast: IYoutubeLiveBroadcast): IStreamEvent {
  return {
    platform: 'youtube',
    id: ytBroadcast.id,
    date: new Date(
      ytBroadcast.snippet.scheduledStartTime || ytBroadcast.snippet.actualStartTime,
    ).valueOf(),
    title: ytBroadcast.snippet.title,
    status: ytBroadcast.status.lifeCycleStatus === 'complete' ? 'completed' : 'scheduled',
  };
}

function convertFBLiveVideoToEvent(fbLiveVideo: IFacebookLiveVideoExtended): IStreamEvent {
  return {
    platform: 'facebook',
    id: fbLiveVideo.id,
    date: new Date(fbLiveVideo.planned_start_time || fbLiveVideo.broadcast_start_time).valueOf(),
    title: fbLiveVideo.title,
    status: 'scheduled',
    facebook: {
      destinationType: fbLiveVideo.destinationType,
      destinationId: fbLiveVideo.destinationId,
    },
  };
}
