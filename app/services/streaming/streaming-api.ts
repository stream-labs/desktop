import { Observable } from 'rxjs';

export enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending',
  Reconnecting = 'reconnecting',
}

export enum ERecordingState {
  Offline = 'offline',
  Starting = 'starting',
  Recording = 'recording',
  Stopping = 'stopping',
}

export enum EReplayBufferState {
  Running = 'running',
  Stopping = 'stopping',
  Offline = 'offline',
  Saving = 'saving',
}

export interface IStreamingServiceState {
  streamingStatus: EStreamingState;
  streamingStatusTime: string;
  recordingStatus: ERecordingState;
  recordingStatusTime: string;
  replayBufferStatus: EReplayBufferState;
  replayBufferStatusTime: string;
}

export interface IStreamingServiceApi {
  getModel(): IStreamingServiceState;

  /**
   * Subscribe to be notified when the state
   * of the streaming output changes.
   */
  streamingStatusChange: Observable<EStreamingState>;

  /**
   * Subscribe to be notified when the state
   * of the streaming output changes.
   */
  recordingStatusChange: Observable<ERecordingState>;

  /**
   * This subscription receives no events and
   * will be removed in a future version.
   * @deprecated
   */
  streamingStateChange: Observable<void>;

  /**
   * @deprecated
   */
  startStreaming(): void;

  /**
   * @deprecated
   */
  stopStreaming(): void;

  /**
   * Toggle the streaming state
   */
  toggleStreaming(): void;

  /**
   * @deprecated
   */
  startRecording(): void;

  /**
   * @deprecated
   */
  stopRecording(): void;

  /**
   * Toggle the recording state
   */
  toggleRecording(): void;
}
