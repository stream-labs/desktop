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
  IPlatformFlags,
  IPlatformCommonFields,
  IStreamSettings,
} from './streaming-api';
import { UsageStatisticsService } from 'services/usage-statistics';
import { $t } from 'services/i18n';
import {
  getPlatformService,
  TStartStreamOptions,
  TPlatform,
  TPlatformCapability,
} from 'services/platforms';
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
import { ITwitchStartStreamOptions, TwitchService } from 'services/platforms/twitch';
import { FacebookService, IFacebookStartStreamOptions } from 'services/platforms/facebook';
import Utils from 'services/utils';
import Vue from 'vue';
import { ISourcesState, Source } from '../sources';
import { cloneDeep, difference } from 'lodash';
import watch from 'vuex';
import { createStreamError, IStreamError, StreamError, TStreamErrorType } from './stream-error';
import { authorizedHeaders } from '../../util/requests';
import { HostsService } from '../hosts';
import { IEncoderProfile } from '../video-encoding-optimizations/definitions';

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
  streamInfoChanged = new Subject<StreamInfoView>();

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

    // watch for StreamInfoView at emit `streamInfoChanged` event if something has been hanged there
    this.store.watch(
      () => {
        return this.views;
      },
      val => {
        console.log('InfoChanged', val, val.viewerCount);
        // show the error if child window is closed
        if (val.info.error && !this.windowsService.state.child.isShown) {
          this.showGoLiveWindow();
        }
        this.streamInfoChanged.next(val);
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
      try {
        await service.prepopulateInfo();
      } catch (e) {
        this.SET_ERROR('PREPOPULATE_FAILED', e.details, platform);
        this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
        return;
      }
      // facebook should have pages
      if (platform === 'facebook' && !this.facebookService.state.facebookPages?.pages?.length) {
        this.SET_ERROR('FACEBOOK_HAS_NO_PAGES');
        this.UPDATE_STREAM_INFO({ lifecycle: 'empty' });
        return;
      }
    }
    this.UPDATE_STREAM_INFO({ lifecycle: 'waitForNewSettings' });
  }

  /**
   * Make a transition to Live
   */
  async goLive(settings?: IGoLiveSettings, unattendedMode = false) {
    if (!this.userService.isLoggedIn) {
      this.finishStartStreaming();
      return;
    }
    this.RESET_STREAM_INFO();

    // use default settings if no new settings provided
    if (!settings) settings = cloneDeep(this.views.goLiveSettings);
    settings = this.views.sanitizeSettings(settings);
    this.streamSettingsService.setSettings({ goLiveSettings: settings });
    this.UPDATE_STREAM_INFO({ lifecycle: 'runChecklist' });

    // update channel settings for each platform
    const platforms = this.views.enabledPlatforms;
    for (const platform of platforms) {
      const service = getPlatformService(platform);
      try {
        await this.runCheck(platform, () => service.beforeGoLive(settings));
      } catch (e) {
        console.error(e);
        this.setError('SETTINGS_UPDATE_FAILED', e.details, platform);
        return;
      }
    }

    // setup restream
    if (this.views.isMutliplatformMode) {
      // check the Restream service is available
      let ready = false;
      try {
        await this.runCheck(
          'setupRestream',
          async () => (ready = await this.restreamService.checkStatus()),
        );
      } catch (e) {
        console.error('Error fetching restreaming service', e);
      }
      // Assume restream is down
      if (!ready) {
        this.setError('RESTREAM_DISABLED');
        return;
      }

      // update restream settings
      try {
        await this.runCheck('setupRestream', () => this.restreamService.beforeGoLive());
      } catch (e) {
        console.error('Failed to setup restream', e);
        this.setError('RESTREAM_SETUP_FAILED');
        return;
      }
    }

    // apply optimized settings
    const optimizer = this.videoEncodingOptimizationService;
    if (optimizer.state.useOptimizedProfile) {
      if (unattendedMode && optimizer.canApplyProfileFromCache()) {
        optimizer.applyProfileFromCache();
      } else {
        optimizer.applyProfile(settings.optimizedProfile);
      }
      await this.runCheck('applyOptimizedSettings');
    }

    // we are ready to start streaming
    try {
      await this.runCheck('startVideoTransmission', () => this.finishStartStreaming());
    } catch (e) {
      return;
    }

    // publish the Youtube broadcast
    if (this.streamSettingsService.protectedModeEnabled && settings.destinations.youtube?.enabled) {
      try {
        await this.runCheck('publishYoutubeBroadcast', () =>
          getPlatformService('youtube').afterGoLive(),
        );
      } catch (e) {
        this.setError(e);
        return;
      }
    }

    this.UPDATE_STREAM_INFO({ lifecycle: 'live' });
    this.createGameAssociation(this.views.game);
  }

  /**
   * Update stream stetting while being live
   */
  async updateStreamSettings(settings: IGoLiveSettings) {
    settings = this.views.sanitizeSettings(settings);

    // run checklist
    this.RESET_STREAM_INFO();
    this.UPDATE_STREAM_INFO({ lifecycle: 'runChecklist' });

    // call putChannelInfo for each platform
    const platforms = this.views.enabledPlatforms;
    for (const platform of platforms) {
      const service = getPlatformService(platform);
      const newSettings = settings.destinations[platform];
      try {
        await this.runCheck(platform, () => service.putChannelInfo(newSettings));
      } catch (e) {
        console.error(e);
        this.setError('SETTINGS_UPDATE_FAILED', e.details, platform);
        return;
      }
    }

    // save updated settings locally
    this.streamSettingsService.setSettings({ goLiveSettings: settings });
    // return back to the 'live' state
    this.UPDATE_STREAM_INFO({ lifecycle: 'live' });
  }

  /**
   * Update stream stetting while being live
   */
  async scheduleStream(settings: IStreamSettings, time: string) {
    settings = this.views.sanitizeSettings(settings);
    const destinations = settings.destinations;
    const platforms = (Object.keys(destinations) as TPlatform[]).filter(
      dest => destinations[dest].enabled && this.views.supports('stream-schedule', dest),
    );
    for (const platform of platforms) {
      const service = getPlatformService(platform);
      await service.scheduleStream(time, destinations[platform]);
    }
  }

  /**
   * update checklist item status based callback result
   */
  private async runCheck(
    checkName: keyof IStreamInfo['checklist'],
    cb?: (...args: unknown[]) => Promise<unknown>,
  ) {
    this.SET_CHECKLIST_ITEM(checkName, 'pending');
    try {
      if (cb) await cb();
      this.SET_CHECKLIST_ITEM(checkName, 'done');
    } catch (e) {
      this.SET_CHECKLIST_ITEM(checkName, 'failed');
      throw e;
    }
  }

  @mutation()
  private UPDATE_STREAM_INFO(statusPatch: Partial<IStreamInfo>) {
    this.state.info = { ...this.state.info, ...statusPatch };
  }

  private setError(
    errorTypeOrError?: TStreamErrorType | StreamError,
    errorDetails?: string,
    platform?: TPlatform,
  ) {
    if (typeof errorTypeOrError === 'object') {
      // an error object has been passed as a first arg
      const error = (errorTypeOrError as StreamError).getModel();
      this.SET_ERROR(error.type, error.details, error.platform);
    } else {
      // an error type has been passed as a first arg
      const errorType = errorTypeOrError as TStreamErrorType;
      this.SET_ERROR(errorType, errorDetails, platform);
    }
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
        await this.goLive();
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

      this.windowsService.actions.closeChildWindow();

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
      title: $t('Go Live'),
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
      componentName: 'EditStreamWindow',
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
          game = this.views.game;
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
    this.views.enabledPlatforms.forEach(platform => {
      const service = getPlatformService(platform);
      if (typeof service.afterStopStream === 'function') {
        service.afterStopStream();
      }
    });
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
  @Inject() private restreamService: RestreamService;
  @Inject() private twitchService: TwitchService;

  get info() {
    return this.state.info;
  }

  /**
   * returns sorted list of all platforms
   */
  get allPlatforms(): TPlatform[] {
    return this.sortPlatforms(['twitch', 'mixer', 'facebook', 'youtube']);
  }

  get linkedPlatforms(): TPlatform[] {
    if (!this.userService.isLoggedIn) return [];
    return this.allPlatforms.filter(p => this.isPlatformLinked(p));
  }

  get enabledPlatforms(): TPlatform[] {
    const goLiveSettings = this.goLiveSettings;
    return Object.keys(goLiveSettings.destinations).filter(
      (platform: TPlatform) =>
        this.linkedPlatforms.includes(platform) && goLiveSettings.destinations[platform].enabled,
    ) as TPlatform[];
  }

  get isMutliplatformMode() {
    return (
      this.streamSettingsService.state.protectedModeEnabled && this.enabledPlatforms.length > 1
    );
  }

  get isMidStreamMode(): boolean {
    return this.state.streamingStatus !== 'offline';
  }

  get viewerCount(): number {
    if (!this.enabledPlatforms.length) return 0;
    return this.enabledPlatforms
      .map(platform => getPlatformService(platform).state.viewersCount)
      .reduce((c1, c2) => c1 + c2);
  }

  get chatUrl(): string {
    if (!this.userService.isLoggedIn) return '';
    return this.isMutliplatformMode
      ? this.restreamService.chatUrl
      : getPlatformService(this.enabledPlatforms[0]).state.chatUrl;
  }

  get goLiveSettings(): IGoLiveSettings {
    // return already saved settings if exist
    if (this.streamSettingsService.state.goLiveSettings) {
      return this.sanitizeSettings(this.streamSettingsService.state.goLiveSettings);
    }

    // otherwise generate new settings
    const { title, description } = this.streamSettingsService.state; // migrate title and description
    const destinations = {};
    this.linkedPlatforms.forEach(platform => {
      destinations[platform] = this.getDefaultPlatformSettings(platform);
    });

    return {
      commonFields: {
        title,
        description,
        game: '',
      },
      destinations: destinations as IGoLiveSettings['destinations'],
      optimizedProfile: null,
      advancedMode: false,
    };
  }

  get game(): string {
    return this.goLiveSettings.commonFields.game;
  }

  get canShowOnlyRequiredFields(): boolean {
    return this.enabledPlatforms.length > 1 && !this.goLiveSettings.advancedMode;
  }

  /**
   * Sort the platform list
   * - the primary platform is always first
   * - linked platforms are always on the top of the list
   * - the rest has an alphabetic sort
   */
  sortPlatforms(platforms: TPlatform[]): TPlatform[] {
    platforms = platforms.sort();
    return [
      ...platforms.filter(p => this.isPrimaryPlatform(p)),
      ...platforms.filter(p => !this.isPrimaryPlatform(p) && this.isPlatformLinked(p)),
      ...platforms.filter(p => !this.isPlatformLinked(p)),
    ];
  }

  /**
   * returns `true` if all enabled platforms have prepopulated their settings
   */
  isPrepopulated(platforms: TPlatform[]): boolean {
    for (const platform of platforms) {
      if (!getPlatformService(platform).state.isPrepopulated) return false;
    }
    return true;
  }

  supports(capability: TPlatformCapability, platform?: TPlatform) {
    const platforms = platform ? [platform] : this.linkedPlatforms;
    for (platform of platforms) {
      if (getPlatformService(platform).capabilities.has(capability)) return true;
    }
  }

  isPlatformLinked(platform: TPlatform): boolean {
    return !!this.userService.state.auth.platforms[platform];
  }

  isPrimaryPlatform(platform: TPlatform) {
    return platform === this.userService.state.auth.primaryPlatform;
  }

  /**
   * Returns merged common settings + required platform settings
   */
  getPlatformSettings<T extends IStreamSettings>(
    platform: TPlatform,
    settings: T,
  ): IPlatformFlags & IPlatformCommonFields {
    const platformSettings = settings.destinations[platform];

    // if platform use custom settings, than return without merging
    if (platformSettings.useCustomFields) return platformSettings;

    // otherwise merge common settings
    const commonFields = {
      title: settings.commonFields.title,
    };
    if (this.supports('description', platform)) {
      commonFields['description'] = settings.commonFields.description;
    }

    if (this.supports('game', platform)) {
      commonFields['game'] = settings.commonFields.game;
    }
    return {
      ...platformSettings,
      ...commonFields,
    };
  }

  sanitizeSettings<T extends IStreamSettings>(settings: T): T {
    settings = cloneDeep(settings);
    const destinations = settings.destinations;
    const linkedPlatforms = this.linkedPlatforms;

    // delete unlinked platforms if provided
    Object.keys(destinations).forEach((destName: TPlatform) => {
      if (!linkedPlatforms.includes(destName)) delete destinations[destName];
    });

    // add linked platforms if not exist
    difference(linkedPlatforms, Object.keys(destinations) as TPlatform[]).forEach(destName => {
      // TODO: fix types
      // @ts-ignore
      destinations[destName] = this.getDefaultPlatformSettings(destName);
    });

    // set common fields for each platform
    Object.keys(destinations).forEach((destName: TPlatform) => {
      // TODO: fix types
      // @ts-ignore
      destinations[destName] = this.getPlatformSettings(destName, settings);
    });
    return settings;
  }

  /**
   * Validates settings and returns an error string
   */
  validateSettings<T extends IStreamSettings>(settings: T): string {
    const platforms = Object.keys(settings.destinations) as TPlatform[];
    for (const platform of platforms) {
      const platformSettings = this.getPlatformSettings(platform, settings);
      const platformName = getPlatformService(platform).displayName;
      if (platform === 'twitch' || platform === 'facebook') {
        if (!platformSettings.game) {
          return $t('You must select a game for %{platformName}', { platformName });
        }
      }
    }
    return '';
  }

  private getDefaultPlatformSettings(platform: TPlatform) {
    const enabled = this.isPrimaryPlatform(platform);
    const service = getPlatformService(platform);
    return {
      ...service.state.settings,
      enabled,
      useCustomFields: false,
    };
  }
}
