import { StatefulService, mutation } from 'services/stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from 'util/injector';
import moment from 'moment';
import { padStart } from 'lodash';
import { SettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import { Subject } from 'rxjs';
import electron from 'electron';
import {
  IStreamingServiceApi,
  IStreamingServiceState,
  EStreamingState,
  ERecordingState
} from './streaming-api';
import { UsageStatisticsService } from 'services/usage-statistics';
import { $t } from 'services/i18n';
import { StreamInfoService } from 'services/stream-info';
import { getPlatformService, IPlatformAuth, TPlatform, IPlatformService } from 'services/platforms';
import { UserService } from 'services/user';
import { AnnouncementsService } from 'services/announcements';
import { NotificationsService, ENotificationType, INotification } from 'services/notifications';

enum EOBSOutputType {
  Streaming = 'streaming',
  Recording = 'recording'
}

enum EOBSOutputSignal {
  Starting = 'starting',
  Start = 'start',
  Stopping = 'stopping',
  Stop = 'stop',
  Reconnect = 'reconnect',
  ReconnectSuccess = 'reconnect_success'
}

interface IOBSOutputSignalInfo {
  type: EOBSOutputType;
  signal: EOBSOutputSignal;
  code: obs.EOutputCode;
  error: string;
}

export class StreamingService extends StatefulService<IStreamingServiceState>
  implements IStreamingServiceApi {
  @Inject() settingsService: SettingsService;
  @Inject() windowsService: WindowsService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() notificationsService: NotificationsService;
  @Inject() userService: UserService;
  @Inject() private announcementsService: AnnouncementsService;

  streamingStatusChange = new Subject<EStreamingState>();
  recordingStatusChange = new Subject<ERecordingState>();

  // Dummy subscription for stream deck
  streamingStateChange = new Subject<void>();

  powerSaveId: number;

  static initialState = {
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString(),
    recordingStatus: ERecordingState.Offline,
    recordingStatusTime: new Date().toISOString()
  };

  init() {
    obs.NodeObs.OBS_service_connectOutputSignals(
      (info: IOBSOutputSignalInfo) => {
        this.handleOBSOutputSignal(info);
      }
    );
  }

  getModel() {
    return this.state;
  }

  get isStreaming() {
    return this.state.streamingStatus !== EStreamingState.Offline;
  }

  get isRecording() {
    return this.state.recordingStatus !== ERecordingState.Offline;
  }

  /**
   * @deprecated Use toggleStreaming instead
   */
  startStreaming() {
    this.toggleStreaming();
  }

  /**
   * @deprecated Use toggleStreaming instead
   */
  stopStreaming() {
    this.toggleStreaming();
  }

  finishStartStreaming() {
    const shouldConfirm = this.settingsService.state.General.WarnBeforeStartingStream;
    const confirmText = 'Are you sure you want to start streaming?';
    if (shouldConfirm && !confirm(confirmText)) return;
    this.powerSaveId = electron.remote.powerSaveBlocker.start(
      'prevent-display-sleep'
    );
    obs.NodeObs.OBS_service_startStreaming();
    const recordWhenStreaming = this.settingsService.state.General.RecordWhenStreaming;
    if (recordWhenStreaming && this.state.recordingStatus === ERecordingState.Offline) {
      this.toggleRecording();
    }
  }

  toggleStreaming() {
    if (this.state.streamingStatus === EStreamingState.Offline) {
      if (this.userService.isLoggedIn && this.userService.platform) {
        const service = getPlatformService(this.userService.platform.type);
        service.beforeGoLive().then(() => this.finishStartStreaming());
        return;
      }
      this.finishStartStreaming();
      return;
    }

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Live
    ) {
      const shouldConfirm = this.settingsService.state.General
        .WarnBeforeStoppingStream;
      const confirmText = $t('Are you sure you want to stop streaming?');

      if (shouldConfirm && !confirm(confirmText)) return;

      if (this.powerSaveId) {
        electron.remote.powerSaveBlocker.stop(this.powerSaveId);
      }

      obs.NodeObs.OBS_service_stopStreaming(false);

      const keepRecording = this.settingsService.state.General
        .KeepRecordingWhenStreamStops;
      if (
        !keepRecording &&
        this.state.recordingStatus === ERecordingState.Recording
      ) {
        this.toggleRecording();
      }

      this.announcementsService.updateBanner();

      return;
    }

    if (this.state.streamingStatus === EStreamingState.Ending) {
      obs.NodeObs.OBS_service_stopStreaming(true);
      return;
    }
  }

  /**
   * @deprecated Use toggleRecording instead
   */
  startRecording() {
    this.toggleRecording();
  }

  /**
   * @deprecated Use toggleRecording instead
   */
  stopRecording() {
    this.toggleRecording();
  }

  toggleRecording() {
    if (this.state.recordingStatus === ERecordingState.Recording) {
      obs.NodeObs.OBS_service_stopRecording();
      return;
    }

    if (this.state.recordingStatus === ERecordingState.Offline) {
      obs.NodeObs.OBS_service_startRecording();
      return;
    }
  }

  showEditStreamInfo() {
    this.windowsService.showWindow({
      componentName: 'EditStreamInfo',
      title: $t('Update Stream Info'),
      queryParams: {},
      size: {
        width: 500,
        height: 400
      }
    });
  }

  get delayEnabled() {
    return this.settingsService.state.Advanced.DelayEnable;
  }

  get delaySeconds() {
    return this.settingsService.state.Advanced.DelaySec;
  }

  get delaySecondsRemaining() {
    if (!this.delayEnabled) return 0;

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Ending
    ) {
      const elapsedTime =
        moment().unix() - this.streamingStateChangeTime.unix();
      return Math.max(this.delaySeconds - elapsedTime, 0);
    }

    return 0;
  }

  /**
   * Gives a formatted time that the streaming output has been in
   * its current state.
   */
  get formattedDurationInCurrentStreamingState() {
    const formattedTime = this.formattedDurationSince(this.streamingStateChangeTime);
    if (formattedTime === '03:50:00' && this.userService.platform.type ===  'facebook') {
      const msg = $t('You are 10 minutes away from the 4 hour stream limit');
      const existingTimeupNotif = this.notificationsService.getUnread()
        .filter((notice: INotification) => notice.message === msg);
      if (existingTimeupNotif.length !== 0) return formattedTime;
      this.notificationsService.push({
        type: ENotificationType.INFO,
        lifeTime: 600000,
        showTime: true,
        message: msg
      });
    }
    return formattedTime;
  }

  get streamingStateChangeTime() {
    return moment(this.state.streamingStatusTime);
  }

  private sendReconnectingNotification() {
    const msg = $t('Stream has disconnected, attempting to reconnect.');
    const existingReconnectNotif = this.notificationsService.getUnread()
      .filter((notice: INotification) => notice.message === msg);
    if (existingReconnectNotif.length !== 0) return;
    this.notificationsService.push({
      type: ENotificationType.WARNING,
      lifeTime: -1,
      showTime: true,
      message: msg
    });
  }

  private clearReconnectingNotification() {
    const notice = this.notificationsService.getAll()
      .find((notice: INotification) => notice.message === $t('Stream has disconnected, attempting to reconnect.'));
    if (!notice) return;
    this.notificationsService.markAsRead(notice.id);
  }

  private formattedDurationSince(timestamp: moment.Moment) {
    const duration = moment.duration(moment().diff(timestamp));
    const seconds = padStart(duration.seconds().toString(), 2, '0');
    const minutes = padStart(duration.minutes().toString(), 2, '0');
    const dayHours = duration.days() * 24;
    const hours = padStart((dayHours + duration.hours()).toString(), 2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  private handleOBSOutputSignal(info: IOBSOutputSignalInfo) {
    console.debug('OBS Output signal: ', info);

    if (info.type === EOBSOutputType.Streaming) {
      const time = new Date().toISOString();

      if (info.signal === EOBSOutputSignal.Start) {
        this.SET_STREAMING_STATUS(EStreamingState.Live, time);
        this.streamingStatusChange.next(EStreamingState.Live);

        let streamEncoderInfo: Dictionary<string> = {};
        let game: string = null;

        try {
          streamEncoderInfo = this.settingsService.getStreamEncoderSettings();
          if (this.streamInfoService.state.channelInfo) {
            game = this.streamInfoService.state.channelInfo.game;
          }
        } catch (e) {
          console.error('Error fetching stream encoder info: ', e);
        }

        this.usageStatisticsService.recordEvent('stream_start', {
          ...streamEncoderInfo,
          game
        });
      } else if (info.signal === EOBSOutputSignal.Starting) {
        this.SET_STREAMING_STATUS(EStreamingState.Starting, time);
        this.streamingStatusChange.next(EStreamingState.Starting);
      } else if (info.signal === EOBSOutputSignal.Stop) {
        this.SET_STREAMING_STATUS(EStreamingState.Offline, time);
        this.streamingStatusChange.next(EStreamingState.Offline);
        this.usageStatisticsService.recordEvent('stream_end');
      } else if (info.signal === EOBSOutputSignal.Stopping) {
        this.SET_STREAMING_STATUS(EStreamingState.Ending, time);
        this.streamingStatusChange.next(EStreamingState.Ending);
      } else if (info.signal === EOBSOutputSignal.Reconnect) {
        this.SET_STREAMING_STATUS(EStreamingState.Reconnecting);
        this.streamingStatusChange.next(EStreamingState.Reconnecting);
        this.sendReconnectingNotification();
      } else if (info.signal === EOBSOutputSignal.ReconnectSuccess) {
        this.SET_STREAMING_STATUS(EStreamingState.Live);
        this.streamingStatusChange.next(EStreamingState.Live);
        this.clearReconnectingNotification();
      }
    } else if (info.type === EOBSOutputType.Recording) {
      const time = new Date().toISOString();

      if (info.signal === EOBSOutputSignal.Start) {
        this.SET_RECORDING_STATUS(ERecordingState.Recording, time);
        this.recordingStatusChange.next(ERecordingState.Recording);
      } else if (info.signal === EOBSOutputSignal.Starting) {
        this.SET_RECORDING_STATUS(ERecordingState.Starting, time);
        this.recordingStatusChange.next(ERecordingState.Starting);
      } else if (info.signal === EOBSOutputSignal.Stop) {
        this.SET_RECORDING_STATUS(ERecordingState.Offline, time);
        this.recordingStatusChange.next(ERecordingState.Offline);
      } else if (info.signal === EOBSOutputSignal.Stopping) {
        this.SET_RECORDING_STATUS(ERecordingState.Stopping, time);
        this.recordingStatusChange.next(ERecordingState.Stopping);
      }
    }

    if (info.code) {
      let errorText = '';

      if (info.code === obs.EOutputCode.BadPath) {
        errorText =
          $t('Invalid Path or Connection URL.  Please check your settings to confirm that they are valid.');
      } else if (info.code === obs.EOutputCode.ConnectFailed) {
        errorText =
          $t('Failed to connect to the streaming server.  Please check your internet connection.');
      } else if (info.code === obs.EOutputCode.Disconnected) {
        errorText =
          $t('Disconnected from the streaming server.  Please check your internet connection.');
      } else if (info.code === obs.EOutputCode.InvalidStream) {
        errorText =
          $t('Could not access the specified channel or stream key, please double-check your stream key.  ') +
          $t('If it is correct, there may be a problem connecting to the server.');
      } else if (info.code === obs.EOutputCode.NoSpace) {
        errorText = $t('There is not sufficient disk space to continue recording.');
      } else if (info.code === obs.EOutputCode.Unsupported) {
        errorText =
          $t('The output format is either unsupported or does not support more than one audio track.  ') +
          $t('Please check your settings and try again.');
      } else if (info.code === obs.EOutputCode.Error) {
        errorText = $t('An unexpected error occurred:') + info.error;
      }

      alert(errorText);
    }
  }

  @mutation()
  private SET_STREAMING_STATUS(status: EStreamingState, time?: string) {
    this.state.streamingStatus = status;
    if (time) this.state.streamingStatusTime = time;
  }

  @mutation()
  private SET_RECORDING_STATUS(status: ERecordingState, time: string) {
    this.state.recordingStatus = status;
    this.state.recordingStatusTime = time;
  }
}
