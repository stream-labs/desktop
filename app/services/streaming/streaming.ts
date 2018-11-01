import { StatefulService, mutation } from 'services/stateful-service';
import { ObsApiService, EOutputCode } from 'services/obs-api';
import { Inject } from 'util/injector';
import moment from 'moment';
import { padStart } from 'lodash';
import { SettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import { Subject } from 'rxjs/Subject';
import electron from 'electron';
import {
  IStreamingServiceApi,
  IStreamingServiceState,
  EStreamingState,
  ERecordingState
} from './streaming-api';
import { UsageStatisticsService } from 'services/usage-statistics';
import { $t } from 'services/i18n';
import { CustomizationService } from 'services/customization';
import { StreamInfoService }from 'services/stream-info';
import { UserService } from 'services/user';
import { IStreamingSetting } from '../platforms';
import { OptimizedSettings } from 'services/settings/optimizer';

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
  code: EOutputCode;
  error: string;
}

export class StreamingService extends StatefulService<IStreamingServiceState>
  implements IStreamingServiceApi {
  @Inject() obsApiService: ObsApiService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() customizationService: CustomizationService;

  streamingStatusChange = new Subject<EStreamingState>();
  recordingStatusChange = new Subject<ERecordingState>();

  // Dummy subscription for stream deck
  streamingStateChange = new Subject<void>();

  powerSaveId: number;

  static initialState = {
    programFetching: false,
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString(),
    recordingStatus: ERecordingState.Offline,
    recordingStatusTime: new Date().toISOString()
  };

  init() {
    this.obsApiService.nodeObs.OBS_service_connectOutputSignals(
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

  // 配信開始ボタンまたはショートカットキーによる配信開始(対話可能)
  async toggleStreamingAsync(programId: string = '') {
    if (this.isStreaming) {
      this.toggleStreaming();
      return;
    }

    console.log('Start Streaming button: platform=' + JSON.stringify(this.userService.platform));
    if (this.userService.isNiconicoLoggedIn()) {
      try {
        this.SET_PROGRAM_FETCHING(true);
        const setting = await this.userService.updateStreamSettings(programId);
        if (setting.asking) {
          return;
        }
        const streamkey = setting.key;
        if (streamkey === '') {
          return new Promise(resolve => {
            electron.remote.dialog.showMessageBox(
              electron.remote.getCurrentWindow(),
              {
                title: $t('streaming.notBroadcasting'),
                type: 'warning',
                message: $t('streaming.notBroadcastingMessage'),
                buttons: [$t('common.close')],
                noLink: true,
              },
              done => resolve(done)
            );
          });
        }
        if (this.customizationService.optimizeForNiconico) {
          return this.optimizeForNiconico(setting);
        }
      } catch (e) {
        const message = e instanceof Response
          ? $t('streaming.broadcastStatusFetchingError.httpError', { statusText: e.statusText })
          : $t('streaming.broadcastStatusFetchingError.default');

        return new Promise(resolve => {
          electron.remote.dialog.showMessageBox(
            electron.remote.getCurrentWindow(),
            {
              type: 'warning',
              message,
              buttons: [$t('common.close')],
              noLink: true,
            },
            done => resolve(done)
          );
        });
      } finally {
        this.SET_PROGRAM_FETCHING(false);
      }
    }
    this.toggleStreaming();
  }

  toggleStreaming() {
    if (this.state.streamingStatus === EStreamingState.Offline) {
      const shouldConfirm = this.settingsService.state.General
        .WarnBeforeStartingStream;
      const confirmText = $t('streaming.startStreamingConfirm');

      if (shouldConfirm && !confirm(confirmText)) return;

      this.powerSaveId = electron.remote.powerSaveBlocker.start(
        'prevent-display-sleep'
      );
      this.obsApiService.nodeObs.OBS_service_startStreaming();

      const recordWhenStreaming = this.settingsService.state.General
        .RecordWhenStreaming;

      if (
        recordWhenStreaming &&
        this.state.recordingStatus === ERecordingState.Offline
      ) {
        this.toggleRecording();
      }

      return;
    }

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Live ||
      this.state.streamingStatus === EStreamingState.Reconnecting
    ) {
      const shouldConfirm = this.settingsService.state.General
        .WarnBeforeStoppingStream;
      const confirmText = $t('streaming.stopStreamingConfirm');

      if (shouldConfirm && !confirm(confirmText)) return;

      if (this.powerSaveId) {
        electron.remote.powerSaveBlocker.stop(this.powerSaveId);
      }

      this.obsApiService.nodeObs.OBS_service_stopStreaming(false);

      const keepRecording = this.settingsService.state.General
        .KeepRecordingWhenStreamStops;
      if (
        !keepRecording &&
        this.state.recordingStatus === ERecordingState.Recording
      ) {
        this.toggleRecording();
      }

      return;
    }

    if (this.state.streamingStatus === EStreamingState.Ending) {
      this.obsApiService.nodeObs.OBS_service_stopStreaming(true);
      return;
    }
  }

  // 最適化ウィンドウの高さを計算する
  private calculateOptimizeWindowSize(settings: OptimizedSettings): number {
    const windowHeader = 6 + 20 + 1;
    const descriptionLabel = 22.4 + 12;
    const doNotShowCheck = 28 + 12;
    const contentOverhead = 16;
    const modalControls = 8 + 36 + 8;
    const categoryOverhead = 22.4 + 4 + 8 + 8 + 12;
    const lineHeight = 20.8;

    const overhead = windowHeader + descriptionLabel + doNotShowCheck + contentOverhead + modalControls;

    const numCategories = settings.info.length;
    const numLines = settings.info.reduce((sum, tuple) => sum + tuple[1].length, 0);
    const height = overhead + numCategories * categoryOverhead + numLines * lineHeight;
    return Math.floor(height); // floorしないと死ぬ
  }

  private async optimizeForNiconico(streamingSetting: IStreamingSetting) {
    if (streamingSetting.bitrate === undefined) {
      return new Promise(resolve => {
        electron.remote.dialog.showMessageBox(
          electron.remote.getCurrentWindow(),
          {
            title: $t('streaming.bitrateFetchingError.title'),
            type: 'warning',
            message: $t('streaming.bitrateFetchingError.message'),
            buttons: [$t('common.close')],
            noLink: true,
          },
          done => resolve(done)
        );
      });
    }
    const settings = this.settingsService.diffOptimizedSettings(streamingSetting.bitrate);
    if (settings) {
      if (this.customizationService.showOptimizationDialogForNiconico) {
        this.windowsService.showWindow({
          componentName: 'OptimizeForNiconico',
          queryParams: settings,
          size: {
            width: 500,
            height: this.calculateOptimizeWindowSize(settings)
          }
        });
      } else {
        this.settingsService.optimizeForNiconico(settings.delta);
        this.toggleStreaming();
      }
    } else {
      this.toggleStreaming();
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
      this.obsApiService.nodeObs.OBS_service_stopRecording();
      return;
    }

    if (this.state.recordingStatus === ERecordingState.Offline) {
      if (!this.settingsService.isValidOutputRecordingPath()) {
        alert($t('streaming.badPathError'));
        return;
      }
      this.obsApiService.nodeObs.OBS_service_startRecording();
      return;
    }
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
    return this.formattedDurationSince(this.streamingStateChangeTime);
  }

  get streamingStateChangeTime() {
    return moment(this.state.streamingStatusTime);
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

        try {
          streamEncoderInfo = this.settingsService.getStreamEncoderSettings();
        } catch (e) {
          console.error('Error fetching stream encoder info: ', e);
        }

        this.usageStatisticsService.recordEvent('stream_start', streamEncoderInfo);
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
      } else if (info.signal === EOBSOutputSignal.ReconnectSuccess) {
        this.SET_STREAMING_STATUS(EStreamingState.Live);
        this.streamingStatusChange.next(EStreamingState.Live);
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

      if (info.code === EOutputCode.BadPath) {
        errorText =
          $t('streaming.badPathError');
      } else if (info.code === EOutputCode.ConnectFailed) {
        errorText =
          $t('streaming.connectFailedError');
      } else if (info.code === EOutputCode.Disconnected) {
        errorText =
          $t('streaming.disconnectedError');
      } else if (info.code === EOutputCode.InvalidStream) {
        errorText =
          $t('streaming.invalidStreamError');
      } else if (info.code === EOutputCode.NoSpace) {
        errorText = $t('streaming.noSpaceError');
      } else if (info.code === EOutputCode.Unsupported) {
        errorText =
          $t('streaming.unsupportedError');
      } else if (info.code === EOutputCode.Error) {
        errorText = $t('streaming.error') + info.error;
      }

      alert(errorText);
    }
  }

  @mutation()
  private SET_PROGRAM_FETCHING(status: boolean) {
    this.state.programFetching = status;
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
