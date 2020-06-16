import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
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
  IGoLiveSettings,
  IStreamInfo,
  TGoLiveChecklistItemState,
} from './streaming-api';
import { UsageStatisticsService } from 'services/usage-statistics';
import { $t } from 'services/i18n';
import { StreamInfoDeprecatedService } from 'services/stream-info-deprecated';
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
import { FacebookService, IFacebookStartStreamOptions } from 'services/platforms/facebook';
import Utils from 'services/utils';
import Vue from 'vue';
import { ISourcesState, Source } from '../sources';
import { cloneDeep } from 'lodash';
import watch from 'vuex';
import { createStreamError, IStreamError, StreamError, TStreamErrorType } from './stream-error';
import { authorizedHeaders } from '../../util/requests';
import { HostsService } from '../hosts';

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
  @Inject('StreamInfoDeprecatedService') streamInfoService: StreamInfoDeprecatedService;
  @Inject() notificationsService: NotificationsService;
  @Inject() userService: UserService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() private videoEncodingOptimizationService: VideoEncodingOptimizationService;
  @Inject() private navigationService: NavigationService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private restreamService: RestreamService;
  @Inject() private hostsService: HostsService;
  @Inject() private facebookService: FacebookService;

  streamingStatusChange = new Subject<EStreamingState>();
  recordingStatusChange = new Subject<ERecordingState>();
  replayBufferStatusChange = new Subject<EReplayBufferState>();
  replayBufferFileWrite = new Subject<string>();

  // Dummy subscription for stream deck
  streamingStateChange = new Subject<void>();

  powerSaveId: number;

  private resolveStartStreaming: Function = () => {};
  private rejectStartStreaming: Function = () => {};

  static initialState: IStreamingServiceState = {
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString(),
    recordingStatus: ERecordingState.Offline,
    recordingStatusTime: new Date().toISOString(),
    replayBufferStatus: EReplayBufferState.Offline,
    replayBufferStatusTime: new Date().toISOString(),
    selectiveRecording: false,
    info: {
      lifecycle: 'empty',
      error: null,
      goLiveSettings: null,
      checklist: {
        applyOptimizedSettings: 'not-started',
        twitch: 'not-started',
        youtube: 'not-started',
        mixer: 'not-started',
        facebook: 'not-started',
        setupRestream: 'not-started',
        startVideoTransmission: 'not-started',
        publishYoutubeBroadcast: 'not-started',
      },
    },
  };

  init() {
    obs.NodeObs.OBS_service_connectOutputSignals((info: IOBSOutputSignalInfo) => {
      this.handleOBSOutputSignal(info);
    });
    this.store.watch(
      () => {
        return this.state.info;
      },
      val => {
        console.log('InfoChanged', val);
        // show the error if child window is closed
        if (val.error && !this.windowsService.state.child.isShown) {
          this.showGoLiveWindow();
        }
      },
      {
        deep: true,
      },
    );
  }

  get views() {
    return new StreamInfoView(this.state);
  }

  /**
   * sync the settings from platforms with local state
   */
  async prepopulateInfo() {
    this.UPDATE_STREAM_INFO({ lifecycle: 'prepopulate', error: null });
    for (const platform of this.views.enabledPlatforms) {
      const service = getPlatformService(platform);
      // facebook should have pages
      if (platform === 'facebook' && !this.facebookService.state.facebookPages?.pages?.length) {
        this.SET_ERROR('FACEBOOK_HAS_NO_PAGES');
        this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
        return;
      }
      try {
        await service.prepopulateInfo();
      } catch (e) {
        this.SET_ERROR('PREPOPULATE_FAILED', e.details, platform);
        this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
        return;
      }
    }
    this.UPDATE_STREAM_INFO({ lifecycle: 'waitForNewSettings' });
  }

  /**
   * Make a transition to Live
   */
  async goLive(settings?: IGoLiveSettings) {
    this.RESET_STREAM_INFO();

    // use default settings if no new settings provided
    if (!settings) settings = cloneDeep(this.views.goLiveSettings);
    settings = this.sanitizeGoLiveSettings(settings);
    this.streamSettingsService.setSettings({ goLiveSettings: settings });
    this.UPDATE_STREAM_INFO({ lifecycle: 'runChecklist', goLiveSettings: settings });

    // call beforeGoLive for each platform
    // that will update the channel settings for each platform
    const platforms = this.views.enabledPlatforms;
    for (const platform of platforms) {
      const service = getPlatformService(platform);
      this.setChecklistItem(platform, 'pending');
      try {
        await service.beforeGoLive(settings);
      } catch (e) {
        this.setChecklistItem(platform, 'failed', 'SETTINGS_UPDATE_FAILED', e.details, platform);
        console.error(e);
        return;
      }
      this.setChecklistItem(platform, 'done');
    }

    // setup restream
    if (this.views.isMutliplatformMode) {
      this.setChecklistItem('setupRestream', 'pending');
      // check the Restream service is available
      let ready = false;
      try {
        ready = await this.restreamService.checkStatus();
      } catch (e) {
        console.error('Error fetching restreaming service', e);
      }
      // Assume restream is down
      if (!ready) {
        this.setChecklistItem('setupRestream', 'failed', 'RESTREAM_DISABLED');
        return;
      }

      // setup restream
      try {
        await this.restreamService.beforeGoLive();
      } catch (e) {
        console.error('Failed to setup restream', e);
        this.setChecklistItem('setupRestream', 'failed', 'RESTREAM_SETUP_FAILED');
        return;
      }
      this.setChecklistItem('setupRestream', 'done');
    }

    // we are ready to start streaming
    this.setChecklistItem('startVideoTransmission', 'pending');
    try {
      await this.finishStartStreaming();
    } catch (e) {
      this.setChecklistItem('startVideoTransmission', 'failed');
      return;
    }
    this.setChecklistItem('startVideoTransmission', 'done');

    // publish the Youtube broadcast
    if (this.streamSettingsService.protectedModeEnabled && settings.destinations.youtube?.enabled) {
      this.setChecklistItem('publishYoutubeBroadcast', 'pending');
      try {
        await getPlatformService('youtube').afterGoLive();
      } catch (e) {
        this.setChecklistItem('publishYoutubeBroadcast', 'failed', e);
        return;
      }
      this.setChecklistItem('publishYoutubeBroadcast', 'done');
    }

    this.UPDATE_STREAM_INFO({ lifecycle: 'live' });

    this.createGameAssociation(this.views.game);
  }

  /**
   * Update stream stetting while being live
   */
  async updateStreamSettings(settings: IGoLiveSettings) {
    settings = this.sanitizeGoLiveSettings(settings);

    // run checklist
    this.RESET_STREAM_INFO();
    this.UPDATE_STREAM_INFO({ lifecycle: 'runChecklist', goLiveSettings: settings });

    // call putChannelInfo for each platform
    const platforms = this.views.enabledPlatforms;
    for (const platform of platforms) {
      const service = getPlatformService(platform);
      this.setChecklistItem(platform, 'pending');
      const updatedSettings = settings.destinations[platform];
      try {
        await service.putChannelInfo(updatedSettings);
      } catch (e) {
        this.setChecklistItem(platform, 'failed', 'SETTINGS_UPDATE_FAILED', e.details, platform);
        console.error(e);
        return;
      }
      this.setChecklistItem(platform, 'done');
    }

    // save updated settings locally
    this.streamSettingsService.setSettings({ goLiveSettings: settings });
    // return back to the 'live' state
    this.UPDATE_STREAM_INFO({ lifecycle: 'live' });
  }

  private sanitizeGoLiveSettings(settings: IGoLiveSettings): IGoLiveSettings {
    // copy common title and description for all platforms
    const destinations = settings.destinations;
    Object.keys(destinations).forEach((destName: TPlatform) => {
      const dest = destinations[destName];
      if (dest.useCustomTitleAndDescription) return;
      if (dest.title !== void 0) dest.title = settings.commonFields.title;
      if (dest['description'] !== void 0) dest['description'] = settings.commonFields.description;
    });
    return settings;
  }

  /**
   * update the status of a checklist item
   */
  private setChecklistItem(
    itemName: keyof IStreamInfo['checklist'],
    state: TGoLiveChecklistItemState,
    errorTypeOrError?: TStreamErrorType | StreamError,
    errorDetails?: string,
    platform?: TPlatform,
  ) {
    this.SET_CHECKLIST_ITEM(itemName, state);

    // always ask for error description for failed checkbox state
    if (state === 'failed' && !errorTypeOrError) {
      console.error('The error description is required for "failed" state');
    }

    // save the error info to the state if the error exists
    if (!errorTypeOrError) return;
    if (typeof errorTypeOrError === 'object') {
      const error = (errorTypeOrError as StreamError).getModel();
      this.SET_ERROR(error.type, error.details, error.platform);
    } else {
      const errorType = errorTypeOrError as TStreamErrorType;
      this.SET_ERROR(errorType, errorDetails, platform);
    }
  }

  @mutation()
  private UPDATE_STREAM_INFO(statusPatch: Partial<IStreamInfo>) {
    this.state.info = { ...this.state.info, ...statusPatch };
  }

  @mutation()
  private SET_ERROR(type?: TStreamErrorType, details?: string, platform?: TPlatform) {
    this.state.info.error = createStreamError(type, details, platform).getModel();
  }

  @mutation()
  private RESET_ERROR() {
    this.state.info.error = null;
  }

  @mutation()
  private SET_CHECKLIST_ITEM(
    itemName: keyof IStreamInfo['checklist'],
    state: TGoLiveChecklistItemState,
  ) {
    this.state.info.checklist[itemName] = state;
  }

  @mutation()
  private RESET_STREAM_INFO() {
    this.state.info = cloneDeep(StreamingService.initialState.info);
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

  async finishStartStreaming() {
    // register a promise that we should reject or resolve in the `handleObsOutputSignal`
    const startStreamingPromise = new Promise((resolve, reject) => {
      this.resolveStartStreaming = resolve;
      this.rejectStartStreaming = reject;
    });

    const shouldConfirm =
      !this.userService.isLoggedIn && this.streamSettingsService.settings.warnBeforeStartingStream;

    if (shouldConfirm) {
      const goLive = await electron.remote.dialog.showMessageBox(Utils.getMainWindow(), {
        title: $t('Go Live'),
        type: 'warning',
        message: $t('Are you sure you want to start streaming?'),
        buttons: [$t('Cancel'), $t('Go Live')],
      });

      if (!goLive.response) return;
    }

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
    return startStreamingPromise;
  }

  async toggleStreaming(options?: TStartStreamOptions, force = false) {
    if (this.state.streamingStatus === EStreamingState.Offline) {
      // in the "force" mode just try to start streaming without updating channel info
      if (force) {
        await this.finishStartStreaming();
        return Promise.resolve();
      }
      try {
        // if (this.userService.isLoggedIn && this.userService.platform) {
        //   const service = getPlatformService(this.userService.platform.type);
        //
        //   // Twitch is special cased because we can safely call beforeGoLive and it will
        //   // not touch the stream settings if protected mode is off. This is to retain
        //   // compatibility with some legacy use cases.
        //   if (
        //     this.streamSettingsService.protectedModeEnabled ||
        //     this.userService.platformType === 'twitch'
        //   ) {
        //     if (this.restreamService.shouldGoLiveWithRestream) {
        //       if (!this.restreamService.allPlatformsStaged) {
        //         // We don't have enough information to go live with multistream.
        //         // We should gather the information in the edit stream info window.
        //         this.showEditStreamInfo(this.restreamService.platforms, 0);
        //         return;
        //       }
        //
        //       let ready: boolean;
        //
        //       try {
        //         ready = await this.restreamService.checkStatus();
        //       } catch (e) {
        //         // Assume restream is down
        //         console.error('Error fetching restreaming service', e);
        //         ready = false;
        //       }
        //
        //       if (ready) {
        //         // Restream service is up and accepting connections
        //         await this.restreamService.beforeGoLive();
        //       } else {
        //         // Restream service is down, just go live to Twitch for now
        //
        //         electron.remote.dialog.showMessageBox(Utils.getMainWindow(), {
        //           type: 'error',
        //           message: $t(
        //             'Multistream is temporarily unavailable. Your stream is being sent to Twitch only.',
        //           ),
        //           buttons: [$t('OK')],
        //         });
        //
        //         const platform = this.userService.platformType;
        //         await service.beforeGoLive(this.restreamService.state.platforms[platform].options);
        //       }
        //     } else {
        //       await service.beforeGoLive(options);
        //     }
        //   }
        // }
        // await this.finishStartStreaming();
        // return Promise.resolve();
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

      if (shouldConfirm) {
        const endStream = await electron.remote.dialog.showMessageBox(Utils.getMainWindow(), {
          title: $t('End Stream'),
          type: 'warning',
          message: $t('Are you sure you want to stop streaming?'),
          buttons: [$t('Cancel'), $t('End Stream')],
        });

        if (!endStream.response) return;
      }

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

  showGoLiveWindow() {
    const advancedMode = this.streamSettingsService.state.goLiveSettings.advancedMode;
    const height = 750; // advancedMode ? 1080 : 750;
    const width = 900;
    const mainWinBounds = this.windowsService.getBounds('main');

    this.windowsService.showWindow({
      componentName: 'GoLiveWindow',
      title: $t('Update Stream Info'),
      size: {
        height,
        width,
      },
      position: {
        x: mainWinBounds.x + mainWinBounds.width - width,
        y: mainWinBounds.y + mainWinBounds.height - height,
      },
    });
  }

  showEditStream() {
    const height = 750;
    const width = 900;

    this.windowsService.showWindow({
      componentName: 'EditStreamInfoWindow',
      title: $t('Update Stream Info'),
      size: {
        height,
        width,
      },
    });
  }

  openShareStream() {
    this.windowsService.showWindow({
      componentName: 'ShareStream',
      title: $t('Share Your Stream'),
      size: {
        height: 450,
        width: 520,
      },
    });
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
    if (formattedTime === '07:50:00' && this.userService?.platform?.type === 'facebook') {
      const msg = $t('You are 10 minutes away from the 8 hour stream limit');
      const existingTimeupNotif = this.notificationsService.views
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
    const existingReconnectNotif = this.notificationsService.views
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
    const notice = this.notificationsService.views
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
        this.resolveStartStreaming();
        this.streamingStatusChange.next(EStreamingState.Live);

        let streamEncoderInfo: Partial<IOutputSettings> = {};
        let game: string = '';

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
        this.RESET_STREAM_INFO();
        this.rejectStartStreaming();
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
      let extendedErrorText = '';
      let linkToDriverInfo = false;
      let showNativeErrorMessage = false;

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
      } else if (info.code === obs.EOutputCode.OutdatedDriver) {
        linkToDriverInfo = true;
        errorText = $t(
          'An error occurred with the output. This is usually caused by out of date video drivers. Please ensure your Nvidia or AMD drivers are up to date and try again.',
        );
      } else {
        // -4 is used for generic unknown messages in OBS. Both -4 and any other code
        // we don't recognize should fall into this branch and show a generic error.
        errorText = $t(
          'An error occurred with the output. Please check your streaming and recording settings.',
        );
        if (info.error) {
          showNativeErrorMessage = true;
          extendedErrorText = errorText + '\n\n' + $t('System error message:"') + info.error + '"';
        }
      }
      const buttons = [$t('OK')];

      const title = {
        [EOBSOutputType.Streaming]: $t('Streaming Error'),
        [EOBSOutputType.Recording]: $t('Recording Error'),
        [EOBSOutputType.ReplayBuffer]: $t('Replay Buffer Error'),
      }[info.type];

      if (linkToDriverInfo) buttons.push($t('Learn More'));
      if (showNativeErrorMessage) buttons.push($t('More'));

      this.outputErrorOpen = true;
      const errorType = 'error';
      electron.remote.dialog
        .showMessageBox(Utils.getMainWindow(), {
          buttons,
          title,
          type: errorType,
          message: errorText,
        })
        .then(({ response }) => {
          if (linkToDriverInfo && response === 1) {
            this.outputErrorOpen = false;
            electron.remote.shell.openExternal(
              'https://howto.streamlabs.com/streamlabs-obs-19/nvidia-graphics-driver-clean-install-tutorial-7000',
            );
          } else {
            let expectedResponse = 1;
            if (linkToDriverInfo) {
              expectedResponse = 2;
            }
            if (showNativeErrorMessage && response === expectedResponse) {
              const buttons = [$t('OK')];
              electron.remote.dialog
                .showMessageBox({
                  buttons,
                  title,
                  type: errorType,
                  message: extendedErrorText,
                })
                .then(({ response }) => {
                  this.outputErrorOpen = false;
                })
                .catch(() => {
                  this.outputErrorOpen = false;
                });
            } else {
              this.outputErrorOpen = false;
            }
          }
        })
        .catch(() => {
          this.outputErrorOpen = false;
        });
    }
  }

  /**
   * Used to track in aggregate which overlays streamers are using
   * most often for which games, in order to offer a better search
   * experience in the overlay library.
   * @param game the name of the game
   */
  createGameAssociation(game: string) {
    const url = `https://${this.hostsService.overlays}/api/overlay-games-association`;

    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = `game=${encodeURIComponent(game)}`;
    const request = new Request(url, { headers, body, method: 'POST' });

    // This is best effort data gathering, don't explicitly handle errors
    return fetch(request);
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

  private async runPlaformAfterStopStreamHook() {
    if (!this.userService.isLoggedIn) return;
    const service = getPlatformService(this.userService!.platform!.type);
    if (typeof service.afterStopStream === 'function') {
      await service.afterStopStream();
    }
  }
}

/**
 * The stream info view is responsible for keeping
 * reliable, up-to-date information about the user's
 * channel and current stream in the Vuex store for
 * components to make use of.
 */
class StreamInfoView extends ViewHandler<IStreamingServiceState> {
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;

  get info() {
    return this.state.info;
  }

  get availablePlatforms(): TPlatform[] {
    return Object.keys(this.userService.state.auth.platforms).sort() as TPlatform[];
  }

  get enabledPlatforms(): TPlatform[] {
    const goLiveSettings = this.goLiveSettings;
    return Object.keys(goLiveSettings.destinations).filter(
      (platform: TPlatform) =>
        this.availablePlatforms.includes(platform) && goLiveSettings.destinations[platform].enabled,
    ) as TPlatform[];
  }

  get canShowOnlyRequiredFields(): boolean {
    return this.enabledPlatforms.length > 1 && !this.goLiveSettings.advancedMode;
  }

  get isMutliplatformMode() {
    return this.enabledPlatforms.length > 1;
  }

  get isMidStreamMode(): boolean {
    return this.state.streamingStatus !== 'offline';
  }

  get goLiveSettings(): IGoLiveSettings {
    // return already saved settings if exist
    if (this.streamSettingsService.state.goLiveSettings) {
      return this.streamSettingsService.state.goLiveSettings;
    }

    // otherwise generate new settings
    const { title, description } = this.streamSettingsService.state;
    const enabledPlatforms = ['facebook', 'twitch', 'youtube'];
    const destinations = {};
    this.streamSettingsService.allPlatforms.forEach(platform => {
      const service = getPlatformService(platform);
      const enabled = enabledPlatforms.includes(platform);
      destinations[platform] = {
        ...service.state.settings,
        useCustomTitleAndDescription: false,
        enabled,
      };
    });

    return {
      commonFields: {
        title,
        description,
      },
      useOptimizedProfile: false,
      selectedProfile: null,
      destinations: destinations as IGoLiveSettings['destinations'],
      advancedMode: false,
    };
  }

  get game(): string {
    return (
      this.goLiveSettings.destinations.twitch?.game ||
      this.goLiveSettings.destinations.facebook?.game
    );
  }
}
