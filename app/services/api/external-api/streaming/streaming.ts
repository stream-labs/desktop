import { StreamingService as InternalStreamingService } from 'services/streaming';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';

enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending',
  Reconnecting = 'reconnecting',
}

enum ERecordingState {
  Offline = 'offline',
  Starting = 'starting',
  Recording = 'recording',
  Stopping = 'stopping',
}

enum EReplayBufferState {
  Running = 'running',
  Stopping = 'stopping',
  Offline = 'offline',
  Saving = 'saving',
}

interface IStreamingState {
  streamingStatus: EStreamingState;
  streamingStatusTime: string;
  recordingStatus: ERecordingState;
  recordingStatusTime: string;
  replayBufferStatus: EReplayBufferState;
  replayBufferStatusTime: string;
}

@Singleton()
export class StreamingService implements ISerializable {
  @Fallback()
  @Inject()
  protected streamingService: InternalStreamingService;

  get streamingStatusChange(): Observable<EStreamingState> {
    return this.streamingService.streamingStatusChange;
  }

  getModel(): IStreamingState {
    return this.streamingService.getModel();
  }

  toggleRecording(): void {
    return this.streamingService.toggleRecording();
  }

  toggleStreaming(): void {
    return this.streamingService.toggleStreaming();
  }
}
