import { Observable } from 'rxjs/Observable';

export interface IStreamingServiceState {
  isStreaming: boolean;
  isLive: boolean;
  usingDelay: boolean;
  streamStartTime: string;
  streamEndTime: string;
  isRecording: boolean;
  recordStartTime: string;
  streamOk: boolean;
}

export interface IStreamingServiceApi {
  streamingStateChange: Observable<IStreamingServiceState>;
  getModel(): IStreamingServiceState;
  startStreaming(): void;
  stopStreaming(): void;
  startRecording(): void;
  stopRecording(): void;
}