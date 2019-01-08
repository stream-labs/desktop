import { Module, EApiPermissions, apiMethod, apiEvent } from './module';
import { StreamingService, EReplayBufferState } from 'services/streaming';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs';

interface IReplayBufferState {
  status: EReplayBufferState;
  statusTime: string;
}

export class ReplayModule extends Module {
  moduleName = 'Replay';
  permissions = [EApiPermissions.Streaming];

  @Inject() streamingService: StreamingService;

  constructor() {
    super();

    this.streamingService.replayBufferStatusChange.subscribe(() => {
      this.stateChanged.next(this.replayBufferState());
    });

    this.streamingService.replayBufferFileWrite.subscribe(filePath => {
      console.log(filePath);
    });
  }

  @apiEvent()
  stateChanged = new Subject<IReplayBufferState>();

  @apiMethod()
  getReplayBufferState(): IReplayBufferState {
    return this.replayBufferState();
  }

  private replayBufferState(): IReplayBufferState {
    return {
      status: this.streamingService.state.replayBufferStatus,
      statusTime: this.streamingService.state.replayBufferStatusTime,
    };
  }
}
