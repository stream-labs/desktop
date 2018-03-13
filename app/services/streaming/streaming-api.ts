import { Observable } from 'rxjs/Observable';

export enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending'
}

export enum ERecordingState {
  Offline = 'offline',
  Starting = 'starting',
  Recording = 'recording',
  Stopping = 'stopping'
}

export interface IStreamingServiceState {
  streamingStatus: EStreamingState;
  streamingStatusTime: string;
  recordingStatus: ERecordingState;
  recordingStatusTime: string;
}

export interface IStreamingServiceApi {

  getModel(): IStreamingServiceState;

  streamingStatusChange: Observable<EStreamingState>;

  /**
   * Dummy subscription for stream deck
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
