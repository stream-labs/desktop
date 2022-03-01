import { StatefulService, mutation } from 'services/core/stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from 'services/core/injector';
import moment from 'moment';
import { SettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import { Subject } from 'rxjs';
import * as electron from 'electron';
import {
  IStreamingServiceApi,
  IStreamingServiceState,
  EStreamingState,
  ERecordingState,
  EReplayBufferState,
} from './streaming-api';
import { UsageStatisticsService } from 'services/usage-statistics';
import { $t } from 'services/i18n';
import { CustomizationService } from 'services/customization';
import { UserService } from 'services/user';
import { IStreamingSetting } from '../platforms';
import { OptimizedSettings } from 'services/settings/optimizer';
import { NicoliveClient, isOk } from 'services/nicolive-program/NicoliveClient';
import { NotificationsService, ENotificationType, INotification } from 'services/notifications';

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

export class StreamingService
  extends StatefulService<IStreamingServiceState>
  implements IStreamingServiceApi
{
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() customizationService: CustomizationService;
  @Inject() notificationsService: NotificationsService;

  streamingStatusChange = new Subject<EStreamingState>();
  recordingStatusChange = new Subject<ERecordingState>();
  replayBufferStatusChange = new Subject<EReplayBufferState>();
  replayBufferFileWrite = new Subject<string>();

  client: NicoliveClient = new NicoliveClient();

  // Dummy subscription for stream deck
  streamingStateChange = new Subject<void>();

  powerSaveId: number;

  static initialState = {
    programFetching: false,
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString(),
    recordingStatus: ERecordingState.Offline,
    recordingStatusTime: new Date().toISOString(),
    replayBufferStatus: EReplayBufferState.Offline,
    replayBufferStatusTime: new Date().toISOString(),
  };

  init() {
    super.init();

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

  private async showNotBroadcastingMessageBox() {
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
        done => resolve(done),
      );
    });
  }

  /**
   * 配信開始ボタンまたはショートカットキーによる配信開始(対話可能)
   *
   * 現在ログインされているユーザーで、配信可能なチャンネルが存在する場合には、配信番組選択ウィンドウを開きます。
   *
   * 配信番組選択ウィンドウで「配信開始」ボタンを押した時にもこのメソッドが呼ばれ、
   * options.nicoliveProgramSelectorResult に、ウィンドウで選ばれた配信種別と
   * チャンネル番組の場合は番組IDが与えられます。
   *
   * 配信番組選択ウィンドウからの呼び出しの場合、および現在ログインされているユーザーで
   * 配信可能なチャンネルが存在しない場合には、配信開始を試みます。
   */
  async toggleStreamingAsync(
    options: {
      nicoliveProgramSelectorResult?: {
        providerType: 'channel' | 'user';
        channelProgramId?: string;
      };
      mustShowOptimizationDialog?: boolean;
    } = {},
  ) {
    const opts = Object.assign(
      {
        mustShowOptimizationDialog: false,
      },
      options,
    );

    if (this.isStreaming) {
      this.toggleStreaming();
      return;
    }

    console.log('Start Streaming button: platform=' + JSON.stringify(this.userService.platform));
    if (this.userService.isNiconicoLoggedIn()) {
      try {
        this.SET_PROGRAM_FETCHING(true);
        const broadcastableUserProgram = await this.client.fetchOnairUserProgram();

        // 配信番組選択ウィンドウ以外からの呼び出し時
        if (!opts.nicoliveProgramSelectorResult) {
          const broadcastableChannelsResult = await this.client.fetchOnairChannels();

          // 配信可能チャンネルがある時
          // エラー時は チャンネルがない時と同様の挙動とする
          if (isOk(broadcastableChannelsResult) && broadcastableChannelsResult.value.length > 0) {
            this.windowsService.showWindow({
              title: $t('streaming.nicoliveProgramSelector.title'),
              componentName: 'NicoliveProgramSelector',
              size: {
                width: 800,
                height: 800,
              },
            });
            return;
          }

          // 配信可能チャンネルがなく、配信できるユーザー生放送もない場合
          if (!broadcastableUserProgram.programId && !broadcastableUserProgram.nextProgramId) {
            return this.showNotBroadcastingMessageBox();
          }
        }

        // 配信番組選択ウィンドウでチャンネル番組が選ばれた時はそのチャンネル番組を, それ以外の場合は放送中のユーザー番組のIDを代入
        // ユーザー番組については、即時番組があればそれを優先し、なければ予約番組の番組IDを採用する。
        const programId =
          opts.nicoliveProgramSelectorResult &&
          opts.nicoliveProgramSelectorResult.providerType === 'channel' &&
          opts.nicoliveProgramSelectorResult.channelProgramId
            ? opts.nicoliveProgramSelectorResult.channelProgramId
            : broadcastableUserProgram.programId || broadcastableUserProgram.nextProgramId;

        // 配信番組選択ウィンドウでユーザー番組を選んだが、配信可能なユーザー番組がない場合
        if (!programId) {
          return this.showNotBroadcastingMessageBox();
        }

        const setting = await this.userService.updateStreamSettings(programId);
        const streamkey = setting.key;
        if (streamkey === '') {
          return this.showNotBroadcastingMessageBox();
        }
        if (this.customizationService.optimizeForNiconico) {
          return this.optimizeForNiconicoAndStartStreaming(
            setting,
            opts.mustShowOptimizationDialog,
          );
        }
      } catch (e) {
        const message =
          e instanceof Response
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
            done => resolve(done),
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
      const shouldConfirm = this.settingsService.state.General.WarnBeforeStartingStream;
      const confirmText = $t('streaming.startStreamingConfirm');

      if (shouldConfirm && !confirm(confirmText)) return;

      this.powerSaveId = electron.remote.powerSaveBlocker.start('prevent-display-sleep');
      obs.NodeObs.OBS_service_startStreaming();

      return;
    }

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Live ||
      this.state.streamingStatus === EStreamingState.Reconnecting
    ) {
      const shouldConfirm = this.settingsService.state.General.WarnBeforeStoppingStream;
      const confirmText = $t('streaming.stopStreamingConfirm');

      if (shouldConfirm && !confirm(confirmText)) return;

      if (this.powerSaveId) {
        electron.remote.powerSaveBlocker.stop(this.powerSaveId);
      }

      obs.NodeObs.OBS_service_stopStreaming(false);

      const keepRecording = this.settingsService.state.General.KeepRecordingWhenStreamStops;
      if (!keepRecording && this.state.recordingStatus === ERecordingState.Recording) {
        this.toggleRecording();
      }

      const keepReplaying = this.settingsService.state.General.KeepReplayBufferStreamStops;
      if (!keepReplaying && this.state.replayBufferStatus === EReplayBufferState.Running) {
        this.stopReplayBuffer();
      }
      return;
    }

    if (this.state.streamingStatus === EStreamingState.Ending) {
      obs.NodeObs.OBS_service_stopStreaming(true);
      return;
    }
  }

  // 最適化ウィンドウの高さを計算する
  private calculateOptimizeWindowSize(settings: OptimizedSettings): number {
    const windowHeader = 6 + 20 + 1;
    const descriptionLabel = 22.4 + 12;
    const useHardwareCheck = 28 + 12;
    const doNotShowCheck = 28 + 12;
    const contentOverhead = 16;
    const modalControls = 8 + 36 + 8;
    const categoryOverhead = 22.4 + 4 + 8 + 8 + 12;
    const lineHeight = 20.8;

    const overhead =
      windowHeader +
      descriptionLabel +
      useHardwareCheck +
      doNotShowCheck +
      contentOverhead +
      modalControls;

    const numCategories = settings.info.length;
    const numLines = settings.info.reduce((sum, tuple) => sum + tuple[1].length, 0);
    const height = overhead + numCategories * categoryOverhead + numLines * lineHeight;
    return Math.floor(height); // floorしないと死ぬ
  }

  /**
   * ニコニコ生放送用設定最適化を行い、配信を開始する。この際、必要なら最適化ダイアログ表示を行う。
   * @param streamingSetting 番組の情報から得られる最適化の前提となる情報
   * @param mustShowDialog trueなら、設定に変更が必要ない場合や、最適化ダイアログを表示しない接敵のときであっても最適化ダイアログを表示する。
   */
  private async optimizeForNiconicoAndStartStreaming(
    streamingSetting: IStreamingSetting,
    mustShowDialog: boolean,
  ) {
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
          done => resolve(done),
        );
      });
    }
    const settings = this.settingsService.diffOptimizedSettings({
      bitrate: streamingSetting.bitrate,
      useHardwareEncoder: this.customizationService.optimizeWithHardwareEncoder,
    });
    if (Object.keys(settings.delta).length > 0 || mustShowDialog) {
      if (this.customizationService.showOptimizationDialogForNiconico || mustShowDialog) {
        this.windowsService.showWindow({
          componentName: 'OptimizeForNiconico',
          title: $t('streaming.optimizationForNiconico.title'),
          queryParams: settings,
          size: {
            width: 600,
            height: 594,
          },
        });
      } else {
        this.settingsService.optimizeForNiconico(settings.best);
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
      obs.NodeObs.OBS_service_stopRecording();
      return;
    }

    if (this.state.recordingStatus === ERecordingState.Offline) {
      if (!this.settingsService.isValidOutputRecordingPath()) {
        alert($t('streaming.badPathError'));
        return;
      }

      if (this.userService.isNiconicoLoggedIn()) {
        const recordingSettings = this.settingsService.getRecordingSettings();
        if (recordingSettings) {
          // send Recording type to Sentry (どれぐらいURL出力が使われているかの比率を調査する)
          console.error('Recording / recType:' + recordingSettings.recType);
          console.log('Recording / path:' + JSON.stringify(recordingSettings.path));
        }
      }

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
    return this.formattedDurationSince(this.streamingStateChangeTime);
  }

  get streamingStateChangeTime() {
    return moment(this.state.streamingStatusTime);
  }

  private sendReconnectingNotification() {
    const msg = $t('streaming.attemptingToReconnect');
    const existingReconnectNotif = this.notificationsService
      .getUnread()
      .filter((notice: INotification) => notice.message === msg);
    if (existingReconnectNotif.length !== 0) return;
    this.notificationsService.push({
      type: ENotificationType.WARNING,
      lifeTime: -1,
      showTime: true,
      message: $t('streaming.attemptingToReconnect'),
    });
  }

  private clearReconnectingNotification() {
    const notice = this.notificationsService
      .getAll()
      .find((notice: INotification) => notice.message === $t('streaming.attemptingToReconnect'));
    if (!notice) return;
    this.notificationsService.markAsRead(notice.id);
  }

  private formattedDurationSince(timestamp: moment.Moment) {
    const duration = moment.duration(moment().diff(timestamp));
    const seconds = duration.seconds().toString().padStart(2, '0');
    const minutes = duration.minutes().toString().padStart(2, '0');
    const dayHours = duration.days() * 24;
    const hours = (dayHours + duration.hours()).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  private handleOBSOutputSignal(info: IOBSOutputSignalInfo) {
    console.debug('OBS Output signal: ', info);

    const time = new Date().toISOString();

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

        const recordWhenStreaming = this.settingsService.state.General.RecordWhenStreaming;
        if (recordWhenStreaming && this.state.recordingStatus === ERecordingState.Offline) {
          this.toggleRecording();
        }

        const replayWhenStreaming = this.settingsService.state.General.ReplayBufferWhileStreaming;

        if (replayWhenStreaming && this.state.replayBufferStatus === EReplayBufferState.Offline) {
          this.startReplayBuffer();
        }

        this.usageStatisticsService.recordEvent('stream_start', streamEncoderInfo);
      } else if (info.signal === EOBSOutputSignal.Starting) {
        this.SET_STREAMING_STATUS(EStreamingState.Starting, time);
        this.streamingStatusChange.next(EStreamingState.Starting);
      } else if (info.signal === EOBSOutputSignal.Stop) {
        this.SET_STREAMING_STATUS(EStreamingState.Offline, time);
        this.streamingStatusChange.next(EStreamingState.Offline);
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
      }[info.signal as any];

      if (nextState) {
        this.SET_RECORDING_STATUS(nextState, time);
        this.recordingStatusChange.next(nextState);
      }
    } else if (info.type === EOBSOutputType.ReplayBuffer) {
      const nextState: EReplayBufferState = {
        [EOBSOutputSignal.Start]: EReplayBufferState.Running,
        [EOBSOutputSignal.Stopping]: EReplayBufferState.Stopping,
        [EOBSOutputSignal.Stop]: EReplayBufferState.Offline,
        [EOBSOutputSignal.Wrote]: EReplayBufferState.Running,
        [EOBSOutputSignal.WriteError]: EReplayBufferState.Running,
      }[info.signal as any];

      if (nextState) {
        this.SET_REPLAY_BUFFER_STATUS(nextState, time);
        this.replayBufferStatusChange.next(nextState);
      }

      if (info.signal === EOBSOutputSignal.Wrote) {
        this.replayBufferFileWrite.next(obs.NodeObs.OBS_service_getLastReplay());
      }
    }

    if (info.code) {
      let errorText = '';

      if (info.code === obs.EOutputCode.BadPath) {
        errorText = $t('streaming.badPathError');
      } else if (info.code === obs.EOutputCode.ConnectFailed) {
        errorText = $t('streaming.connectFailedError');
      } else if (info.code === obs.EOutputCode.Disconnected) {
        errorText = $t('streaming.disconnectedError');
      } else if (info.code === obs.EOutputCode.InvalidStream) {
        errorText = $t('streaming.invalidStreamError');
      } else if (info.code === obs.EOutputCode.NoSpace) {
        errorText = $t('streaming.noSpaceError');
      } else if (info.code === obs.EOutputCode.Unsupported) {
        errorText = $t('streaming.unsupportedError');
      } else if (info.code === obs.EOutputCode.Error) {
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

  @mutation()
  private SET_REPLAY_BUFFER_STATUS(status: EReplayBufferState, time?: string) {
    this.state.replayBufferStatus = status;
    if (time) this.state.replayBufferStatusTime = time;
  }
}
