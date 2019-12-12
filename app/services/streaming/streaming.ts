import { StatefulService, mutation } from 'services/core/stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from 'services/core/injector';
import moment from 'moment';
import padStart from 'lodash/padStart';
import { IOutputSettings, OutputSettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import { Subject } from 'rxjs';
import electron from 'electron';
import {
  IStreamingServiceApi,
  IStreamingServiceState,
  EStreamingState,
  ERecordingState,
  EReplayBufferState,
} from './streaming-api';
import { UsageStatisticsService } from 'services/usage-statistics';
import { $t } from 'services/i18n';
import { StreamInfoService } from 'services/stream-info';
import { getPlatformService, TStartStreamOptions, TPlatform } from 'services/platforms';
import { UserService } from 'services/user';
import {
  NotificationsService,
  ENotificationType,
  INotification,
  ENotificationSubType,
} from 'services/notifications';
import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
import { NavigationService } from 'services/navigation';
import { CustomizationService } from 'services/customization';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { StreamSettingsService } from '../settings/streaming';
import { RestreamService } from 'services/restream';
import { ITwitchStartStreamOptions } from 'services/platforms/twitch';
import { IFacebookStartStreamOptions } from 'services/platforms/facebook';

enum EOBSOutputType {
  Streaming = 'streaming',
  Recording = 'recording',
  ReplayBuffer = 'replay-buffer',
}

enum EOBSOutputSignal {
  Starting = 'starting',
  Start = 'start',
  Stopping = 'stopping',
  Stop = 'stop',
  Reconnect = 'reconnect',
  ReconnectSuccess = 'reconnect_success',
  Wrote = 'wrote',
  WriteError = 'writing_error',
}

interface IOBSOutputSignalInfo {
  type: EOBSOutputType;
  signal: EOBSOutputSignal;
  code: obs.EOutputCode;
  error: string;
}

export class StreamingService extends StatefulService<IStreamingServiceState>
  implements IStreamingServiceApi {
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() outputSettingsService: OutputSettingsService;
  @Inject() windowsService: WindowsService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() notificationsService: NotificationsService;
  @Inject() userService: UserService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() private videoEncodingOptimizationService: VideoEncodingOptimizationService;
  @Inject() private navigationService: NavigationService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private restreamService: RestreamService;

  streamingStatusChange = new Subject<EStreamingState>();
  recordingStatusChange = new Subject<ERecordingState>();
  replayBufferStatusChange = new Subject<EReplayBufferState>();
  replayBufferFileWrite = new Subject<string>();

  // Dummy subscription for stream deck
  streamingStateChange = new Subject<void>();

  powerSaveId: number;

  static initialState = {
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString(),
    recordingStatus: ERecordingState.Offline,
    recordingStatusTime: new Date().toISOString(),
    replayBufferStatus: EReplayBufferState.Offline,
    replayBufferStatusTime: new Date().toISOString(),
    selectiveRecording: false,
  };

  init() {
    obs.NodeObs.OBS_service_connectOutputSignals((info: IOBSOutputSignalInfo) => {
      this.handleOBSOutputSignal(info);
    });
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

  get isReplayBufferActive() {
    return this.state.replayBufferStatus !== EReplayBufferState.Offline;
  }

  get isIdle(): boolean {
    return !this.isStreaming && !this.isRecording;
  }

  setSelectiveRecording(enabled: boolean) {
    // Selective recording cannot be toggled while live
    if (this.state.streamingStatus !== EStreamingState.Offline) return;

    this.SET_SELECTIVE_RECORDING(enabled);
    obs.Global.multipleRendering = enabled;
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

  private finishStartStreaming() {
    const shouldConfirm = this.streamSettingsService.settings.warnBeforeStartingStream;
    const confirmText = $t('Are you sure you want to start streaming?');
    if (shouldConfirm && !confirm(confirmText)) return;

    this.powerSaveId = electron.remote.powerSaveBlocker.start('prevent-display-sleep');

    obs.NodeObs.OBS_service_startStreaming();

    const recordWhenStreaming = this.streamSettingsService.settings.recordWhenStreaming;

    if (recordWhenStreaming && this.state.recordingStatus === ERecordingState.Offline) {
      this.toggleRecording();
    }

    const replayWhenStreaming = this.streamSettingsService.settings.replayBufferWhileStreaming;

    if (replayWhenStreaming && this.state.replayBufferStatus === EReplayBufferState.Offline) {
      this.startReplayBuffer();
    }
  }

  async toggleStreaming(options?: TStartStreamOptions, force = false) {
    if (this.state.streamingStatus === EStreamingState.Offline) {
      // in the "force" mode just try to start streaming without updating channel info
      if (force) {
        this.finishStartStreaming();
        return Promise.resolve();
      }
      try {
        if (this.userService.isLoggedIn && this.userService.platform) {
          const service = getPlatformService(this.userService.platform.type);

          // Twitch is special cased because we can safely call beforeGoLive and it will
          // not touch the stream settings if protected mode is off. This is to retain
          // compatibility with some legacy use cases.
          if (
            this.streamSettingsService.protectedModeEnabled ||
            this.userService.platformType === 'twitch'
          ) {
            if (this.restreamService.shouldGoLiveWithRestream) {
              let ready: boolean;

              try {
                ready = await this.restreamService.checkStatus();
              } catch (e) {
                // Assume restream is down
                console.error('Error fetching restreaming service', e);
                ready = false;
              }

              if (ready) {
                // Restream service is up and accepting connections
                await this.restreamService.beforeGoLive();
              } else {
                // Restream service is down, just go live to Twitch for now

                electron.remote.dialog.showMessageBox({
                  type: 'error',
                  message: $t(
                    'Multistream is temporarily unavailable. Your stream is being sent to Twitch only.',
                  ),
                  buttons: [$t('OK')],
                });

                const platform = this.userService.platformType;
                await service.beforeGoLive(this.restreamService.state.platforms[platform].options);
              }
            } else {
              await service.beforeGoLive(options);
            }
          }
        }
        this.finishStartStreaming();
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Live ||
      this.state.streamingStatus === EStreamingState.Reconnecting
    ) {
      const shouldConfirm = this.streamSettingsService.settings.warnBeforeStoppingStream;
      const confirmText = $t('Are you sure you want to stop streaming?');

      if (shouldConfirm && !confirm(confirmText)) return Promise.resolve();

      if (this.powerSaveId) {
        electron.remote.powerSaveBlocker.stop(this.powerSaveId);
      }

      obs.NodeObs.OBS_service_stopStreaming(false);

      const keepRecording = this.streamSettingsService.settings.keepRecordingWhenStreamStops;
      if (!keepRecording && this.state.recordingStatus === ERecordingState.Recording) {
        this.toggleRecording();
      }

      const keepReplaying = this.streamSettingsService.settings.keepReplayBufferStreamStops;
      if (!keepReplaying && this.state.replayBufferStatus === EReplayBufferState.Running) {
        this.stopReplayBuffer();
      }

      return Promise.resolve();
    }

    if (this.state.streamingStatus === EStreamingState.Ending) {
      obs.NodeObs.OBS_service_stopStreaming(true);
      return Promise.resolve();
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

  startReplayBuffer() {
    if (this.state.replayBufferStatus !== EReplayBufferState.Offline) return;

    obs.NodeObs.OBS_service_startReplayBuffer();
  }

  stopReplayBuffer() {
    if (this.state.replayBufferStatus === EReplayBufferState.Running) {
      obs.NodeObs.OBS_service_stopReplayBuffer(false);
    } else if (this.state.replayBufferStatus === EReplayBufferState.Stopping) {
      obs.NodeObs.OBS_service_stopReplayBuffer(true);
    }
  }

  saveReplay() {
    if (this.state.replayBufferStatus === EReplayBufferState.Running) {
      this.SET_REPLAY_BUFFER_STATUS(EReplayBufferState.Saving);
      this.replayBufferStatusChange.next(EReplayBufferState.Saving);
      obs.NodeObs.OBS_service_processReplayBufferHotkey();
    }
  }

  /**
   * Opens the "go live" window. Platform is not required to be passed
   * in unless restream is enabled and info is needed for multiple platforms.
   * @param platforms The platforms to set up
   * @param platformStep The current index in the platforms array
   */
  showEditStreamInfo(platforms?: TPlatform[], platformStep = 0) {
    const height = this.twitterIsEnabled ? 620 : 550;
    this.windowsService.showWindow({
      componentName: 'EditStreamInfo',
      title: $t('Update Stream Info'),
      queryParams: { platforms, platformStep },
      size: {
        height,
        width: 600,
      },
    });
  }

  get twitterIsEnabled() {
    return this.incrementalRolloutService.featureIsEnabled(EAvailableFeatures.twitter);
  }

  get delayEnabled() {
    return this.streamSettingsService.settings.delayEnable;
  }

  get delaySeconds() {
    return this.streamSettingsService.settings.delaySec;
  }

  get delaySecondsRemaining() {
    if (!this.delayEnabled) return 0;

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Ending
    ) {
      const elapsedTime = moment().unix() - this.streamingStateChangeTime.unix();
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
    if (formattedTime === '07:50:00' && this.userService.platform.type === 'facebook') {
      const msg = $t('You are 10 minutes away from the 8 hour stream limit');
      const existingTimeupNotif = this.notificationsService
        .getUnread()
        .filter((notice: INotification) => notice.message === msg);
      if (existingTimeupNotif.length !== 0) return formattedTime;
      this.notificationsService.push({
        type: ENotificationType.INFO,
        lifeTime: 600000,
        showTime: true,
        message: msg,
      });
    }
    return formattedTime;
  }

  get formattedDurationInCurrentRecordingState() {
    return this.formattedDurationSince(moment(this.state.recordingStatusTime));
  }

  get streamingStateChangeTime() {
    return moment(this.state.streamingStatusTime);
  }

  private sendReconnectingNotification() {
    const msg = $t('Stream has disconnected, attempting to reconnect.');
    const existingReconnectNotif = this.notificationsService
      .getUnread()
      .filter((notice: INotification) => notice.message === msg);
    if (existingReconnectNotif.length !== 0) return;
    this.notificationsService.push({
      type: ENotificationType.WARNING,
      subType: ENotificationSubType.DISCONNECTED,
      lifeTime: -1,
      showTime: true,
      message: msg,
    });
  }

  private clearReconnectingNotification() {
    const notice = this.notificationsService
      .getAll()
      .find(
        (notice: INotification) =>
          notice.message === $t('Stream has disconnected, attempting to reconnect.'),
      );
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

  private outputErrorOpen = false;

  private handleOBSOutputSignal(info: IOBSOutputSignalInfo) {
    console.debug('OBS Output signal: ', info);

    const time = new Date().toISOString();

    if (info.type === EOBSOutputType.Streaming) {
      if (info.signal === EOBSOutputSignal.Start) {
        this.SET_STREAMING_STATUS(EStreamingState.Live, time);
        this.streamingStatusChange.next(EStreamingState.Live);
        if (this.streamSettingsService.protectedModeEnabled) this.runPlatformAfterGoLiveHook();

        let streamEncoderInfo: Partial<IOutputSettings> = {};
        let game: string = null;

        try {
          streamEncoderInfo = this.outputSettingsService.getSettings();
          game = this.streamInfoService.state.game;
        } catch (e) {
          console.error('Error fetching stream encoder info: ', e);
        }

        const eventMetadata: Dictionary<any> = {
          ...streamEncoderInfo,
          game,
        };

        if (this.videoEncodingOptimizationService.state.useOptimizedProfile) {
          eventMetadata.useOptimizedProfile = true;
        }

        const streamSettings = this.streamSettingsService.settings;

        eventMetadata.streamType = streamSettings.streamType;
        eventMetadata.platform = streamSettings.platform;
        eventMetadata.server = streamSettings.server;

        this.usageStatisticsService.recordEvent('stream_start', eventMetadata);
      } else if (info.signal === EOBSOutputSignal.Starting) {
        this.SET_STREAMING_STATUS(EStreamingState.Starting, time);
        this.streamingStatusChange.next(EStreamingState.Starting);
      } else if (info.signal === EOBSOutputSignal.Stop) {
        this.SET_STREAMING_STATUS(EStreamingState.Offline, time);
        this.streamingStatusChange.next(EStreamingState.Offline);
        if (this.streamSettingsService.protectedModeEnabled) this.runPlaformAfterStopStreamHook();
      } else if (info.signal === EOBSOutputSignal.Stopping) {
        this.SET_STREAMING_STATUS(EStreamingState.Ending, time);
        this.streamingStatusChange.next(EStreamingState.Ending);
        this.usageStatisticsService.recordEvent('stream_end');
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
      const nextState: ERecordingState = {
        [EOBSOutputSignal.Start]: ERecordingState.Recording,
        [EOBSOutputSignal.Starting]: ERecordingState.Starting,
        [EOBSOutputSignal.Stop]: ERecordingState.Offline,
        [EOBSOutputSignal.Stopping]: ERecordingState.Stopping,
      }[info.signal];

      this.SET_RECORDING_STATUS(nextState, time);
      this.recordingStatusChange.next(nextState);
    } else if (info.type === EOBSOutputType.ReplayBuffer) {
      const nextState: EReplayBufferState = {
        [EOBSOutputSignal.Start]: EReplayBufferState.Running,
        [EOBSOutputSignal.Stopping]: EReplayBufferState.Stopping,
        [EOBSOutputSignal.Stop]: EReplayBufferState.Offline,
        [EOBSOutputSignal.Wrote]: EReplayBufferState.Running,
        [EOBSOutputSignal.WriteError]: EReplayBufferState.Running,
      }[info.signal];

      if (nextState) {
        this.SET_REPLAY_BUFFER_STATUS(nextState, time);
        this.replayBufferStatusChange.next(nextState);
      }

      if (info.signal === EOBSOutputSignal.Wrote) {
        this.replayBufferFileWrite.next(obs.NodeObs.OBS_service_getLastReplay());
      }
    }

    if (info.code) {
      if (this.outputErrorOpen) {
        console.warn('Not showing error message because existing window is open.', info);
        return;
      }

      let errorText = '';
      let linkToDriverInfo = false;

      if (info.code === obs.EOutputCode.BadPath) {
        errorText = $t(
          'Invalid Path or Connection URL.  Please check your settings to confirm that they are valid.',
        );
      } else if (info.code === obs.EOutputCode.ConnectFailed) {
        errorText = $t(
          'Failed to connect to the streaming server.  Please check your internet connection.',
        );
      } else if (info.code === obs.EOutputCode.Disconnected) {
        errorText = $t(
          'Disconnected from the streaming server.  Please check your internet connection.',
        );
      } else if (info.code === obs.EOutputCode.InvalidStream) {
        errorText = $t(
          'Could not access the specified channel or stream key. Please log out and back in to refresh your credentials. If the problem persists, there may be a problem connecting to the server.',
        );
      } else if (info.code === obs.EOutputCode.NoSpace) {
        errorText = $t('There is not sufficient disk space to continue recording.');
      } else if (info.code === obs.EOutputCode.Unsupported) {
        errorText =
          $t(
            'The output format is either unsupported or does not support more than one audio track.  ',
          ) + $t('Please check your settings and try again.');
      } else {
        // -4 is used for generic unknown messages in OBS. Both -4 and any other code
        // we don't recognize should fall into this branch and show a generic error.
        if (info.error) {
          errorText = info.error;
        } else {
          linkToDriverInfo = true;
          errorText = $t(
            'An error occurred with the output. This is usually caused by out of date video drivers. Please ensure your Nvidia or AMD drivers are up to date and try again.',
          );
        }
      }

      const buttons = [$t('OK')];
      const title = {
        [EOBSOutputType.Streaming]: $t('Streaming Error'),
        [EOBSOutputType.Recording]: $t('Recording Error'),
        [EOBSOutputType.ReplayBuffer]: $t('Replay Buffer Error'),
      }[info.type];

      if (linkToDriverInfo) buttons.push($t('Learn More'));

      this.outputErrorOpen = true;

      electron.remote.dialog
        .showMessageBox({
          buttons,
          title,
          type: 'error',
          message: errorText,
        })
        .then(({ response }) => {
          this.outputErrorOpen = false;

          if (linkToDriverInfo && response === 1) {
            electron.remote.shell.openExternal(
              'https://howto.streamlabs.com/streamlabs-obs-19/nvidia-graphics-driver-clean-install-tutorial-7000',
            );
          }
        })
        .catch(() => {
          this.outputErrorOpen = false;
        });
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

  @mutation()
  private SET_REPLAY_BUFFER_STATUS(status: EReplayBufferState, time?: string) {
    this.state.replayBufferStatus = status;
    if (time) this.state.replayBufferStatusTime = time;
  }

  @mutation()
  private SET_SELECTIVE_RECORDING(enabled: boolean) {
    this.state.selectiveRecording = enabled;
  }

  private async runPlatformAfterGoLiveHook() {
    if (this.userService.isLoggedIn() && this.userService.platform) {
      const service = getPlatformService(this.userService.platform.type);
      if (typeof service.afterGoLive === 'function') {
        await service.afterGoLive();
      }
    }
  }

  private async runPlaformAfterStopStreamHook() {
    if (!this.userService.isLoggedIn()) return;
    const service = getPlatformService(this.userService.platform.type);
    if (typeof service.afterStopStream === 'function') {
      await service.afterStopStream();
    }
  }
}
