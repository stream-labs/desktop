import { StreamingService as InternalStreamingService } from 'services/streaming';
import { Inject } from 'util/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';
import * as obs from '../../../../../obs-api';

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

/**
 * Provides API to start/stop streaming and recording.
 * Allows watching for streaming status.
 */
@Singleton()
export class StreamingService implements ISerializable {
  @Fallback()
  @Inject()
  protected streamingService: InternalStreamingService;

  get streamingStatusChange(): Observable<EStreamingState> {
    return this.streamingService.streamingStatusChange;
  }

  /**
   * returns current streaming/recording status
   */
  getModel(): IStreamingState {
    return this.streamingService.getModel();
  }

  toggleRecording(): void {
    return this.streamingService.toggleRecording();
  }

  toggleStreaming(): void {
    return this.streamingService.toggleStreaming();
  }

  startReplayBuffer(): void {
    return this.streamingService.startReplayBuffer();
  }

  stopReplayBuffer(): void {
    return this.streamingService.stopReplayBuffer();
  }

  saveReplay(): void {
    return this.streamingService.saveReplay();
  }
}
