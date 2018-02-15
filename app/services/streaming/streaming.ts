import moment from 'moment';

import { Inject } from '../../util/injector';
import { StatefulService, mutation } from '../stateful-service';
import { nodeObs } from '../obs-api';
import { SettingsService } from '../settings';
import { padStart, isEqual } from 'lodash';
import { track } from '../usage-statistics';
import { WindowsService } from '../windows';
import { Subject } from 'rxjs/Subject';
import { IStreamingServiceApi, IStreamingServiceState } from './streaming-api';
import electron from 'electron';


export class StreamingService extends StatefulService<IStreamingServiceState> implements IStreamingServiceApi {

  @Inject() settingsService: SettingsService;
  @Inject() windowsService: WindowsService;

  static initialState = {
    isStreaming: false, // Doesn't account for delay
    isLive: false, // Accounts for delay
    usingDelay: false,
    streamStartTime: null,
    streamEndTime: null,
    isRecording: false,
    recordStartTime: null,
    streamOk: null
  } as IStreamingServiceState;

  @mutation()
  START_STREAMING(startTime: string, usingDelay: boolean) {
    this.state.isStreaming = true;
    this.state.streamStartTime = startTime;
    this.state.streamEndTime = null;
    this.state.usingDelay = usingDelay;
  }

  @mutation()
  STOP_STREAMING(endTime: string) {
    this.state.isStreaming = false;
    this.state.streamEndTime = endTime;
  }

  @mutation()
  SET_IS_LIVE(isLive: boolean) {
    this.state.isLive = isLive;
  }

  @mutation()
  DISCARD_STREAM_DELAY() {
    this.state.streamEndTime = null;
    this.state.isLive = false;
  }

  @mutation()
  START_RECORDING(startTime: string) {
    this.state.isRecording = true;
    this.state.recordStartTime = startTime;
  }

  @mutation()
  STOP_RECORDING() {
    this.state.isRecording = false;
    this.state.recordStartTime = null;
  }

  @mutation()
  SET_STREAM_STATUS(streamOk: boolean) {
    this.state.streamOk = streamOk;
  }

  delayTimeout: number = null;

  streamingStateChange = new Subject<IStreamingServiceState>();

  powerSaveId: number;

  private emittedState: IStreamingServiceState;


  // Only runs once per app lifecycle
  init() {

    // Initialize the stream check interval
    setInterval(
      () => {
        let status;

        if (this.state.isStreaming) {
          status = nodeObs.OBS_service_isStreamingOutputActive() === '1';
        } else {
          status = null;
        }

        this.SET_STREAM_STATUS(status);
        this.emitStateIfChanged();
      },
      10 * 1000
    );
  }


  getModel(): IStreamingServiceState {
    return this.state;
  }


  @track('stream_start')
  startStreaming() {
    if (this.state.isStreaming) return;

    const shouldConfirm = this.settingsService.state.General.WarnBeforeStartingStream;
    const confirmText = 'Are you sure you want to start streaming?';

    if (shouldConfirm && !confirm(confirmText)) return;

    const streamType = this.settingsService.state.Stream.streamType;
    const blankStreamKey = !this.settingsService.state.Stream.key;

    if (streamType !== 'rtmp_custom' && blankStreamKey) {
      alert('No stream key has been entered. Please check your settings and add a valid stream key.');
      return;
    }

    this.powerSaveId = electron.remote.powerSaveBlocker.start('prevent-display-sleep');

    nodeObs.OBS_service_startStreaming();
    this.START_STREAMING((new Date()).toISOString(), this.delayEnabled);

    if (this.state.usingDelay) {
      this.delayTimeout = window.setTimeout(() => {
        this.SET_IS_LIVE(true);
      }, this.delaySeconds * 1000);
    } else {
      this.SET_IS_LIVE(true);
    }

    const recordWhenStreaming = this.settingsService.state.General.RecordWhenStreaming;

    if (recordWhenStreaming && !this.state.isRecording) {
      this.startRecording();
    }
    this.emitStateIfChanged();
  }

  @track('stream_end')
  stopStreaming() {
    if (!this.state.isStreaming) return;

    const shouldConfirm = this.settingsService.state.General.WarnBeforeStoppingStream;
    const confirmText = 'Are you sure you want to stop streaming?';

    if (shouldConfirm && !confirm(confirmText)) return;

    if (this.powerSaveId) electron.remote.powerSaveBlocker.stop(this.powerSaveId);

    nodeObs.OBS_service_stopStreaming(false);
    this.STOP_STREAMING((new Date()).toISOString());
    this.SET_STREAM_STATUS(null);

    if (this.state.usingDelay) {
      this.delayTimeout = window.setTimeout(() => {
        this.SET_IS_LIVE(false);
      }, this.delaySeconds * 1000);
    } else {
      this.SET_IS_LIVE(false);
    }

    const keepRecording = this.settingsService.state.General.KeepRecordingWhenStreamStops;

    if (!keepRecording && this.state.isRecording) {
      this.stopRecording();
    }

    this.emitStateIfChanged();
  }

  discardStreamDelay() {
    if (this.state.isStreaming) return;
    if (!this.delaySecondsRemaining) return;

    nodeObs.OBS_service_stopStreaming(true);
    if (this.delayTimeout) clearTimeout(this.delayTimeout);
    this.DISCARD_STREAM_DELAY();
  }

  startRecording() {
    if (this.state.isRecording) return;

    nodeObs.OBS_service_startRecording();
    this.START_RECORDING((new Date()).toISOString());
    this.emitStateIfChanged();
  }

  stopRecording() {
    if (!this.state.isRecording) return;

    nodeObs.OBS_service_stopRecording();
    this.STOP_RECORDING();
    this.emitStateIfChanged();
  }

  showEditStreamInfo() {
    this.windowsService.showWindow({
      componentName: 'EditStreamInfo',
      queryParams: {  },
      size: {
        width: 500,
        height: 400
      }
    });
  }

  // Getters / Utilty

  get isStreaming() {
    return this.state.isStreaming;
  }

  get isLive() {
    return this.state.isLive;
  }

  get streamStartTime() {
    return moment(this.state.streamStartTime);
  }

  get streamEndTime() {
    return moment(this.state.streamEndTime);
  }

  get formattedElapsedStreamTime() {
    const startTime = this.streamStartTime;

    if (this.state.usingDelay) {
      startTime.add(this.delaySeconds, 'seconds');
    }

    return this.formattedDurationSince(startTime);
  }

  get streamOk() {
    return this.state.streamOk;
  }

  get isRecording() {
    return this.state.isRecording;
  }

  get recordStartTime() {
    return moment(this.state.recordStartTime);
  }

  get formattedElapsedRecordTime() {
    return this.formattedDurationSince(this.recordStartTime);
  }

  private formattedDurationSince(timestamp: moment.Moment) {
    const duration = moment.duration(moment().diff(timestamp));
    const seconds = padStart(duration.seconds().toString(), 2, '0');
    const minutes = padStart(duration.minutes().toString(), 2, '0');
    const hours = padStart(duration.hours().toString(), 2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  private emitStateIfChanged() {
    if (isEqual(this.state, this.emittedState)) return;
    const stateToEmit = { ...this.state };
    this.streamingStateChange.next(this.state);
    this.emittedState = stateToEmit;
  }

  get delayEnabled() {
    return this.settingsService.state.Advanced.DelayEnable;
  }

  get delaySeconds() {
    return this.settingsService.state.Advanced.DelaySec;
  }

  get delaySecondsRemaining() {
    if (!this.state.usingDelay) return 0;

    if (this.isStreaming) {
      const streamingTime = moment().unix() - this.streamStartTime.unix();
      return Math.max(this.delaySeconds - streamingTime, 0);
    }

    if (this.streamEndTime) {
      const endedTime = moment().unix() - this.streamEndTime.unix();
      return Math.max(this.delaySeconds - endedTime, 0);
    }

    return 0;
  }
}
