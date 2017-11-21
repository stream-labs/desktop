export interface IStreamingServiceState {
  isStreaming: boolean;
  streamStartTime: string;
  isRecording: boolean;
  recordStartTime: string;
  streamOk: boolean;
}

export interface IStreamingServiceApi {
  getModel(): IStreamingServiceState;
  startStreaming(): void;
  stopStreaming(): void;
  startRecording(): void;
  stopRecording(): void;
}