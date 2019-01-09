import { Module, EApiPermissions, apiMethod, apiEvent, IApiContext } from './module';
import { StreamingService, EReplayBufferState } from 'services/streaming';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs';
import { FileReturnWrapper } from 'services/guest-api';
import uuid from 'uuid/v4';

interface IReplayBufferState {
  status: EReplayBufferState;
  statusTime: string;
}

interface IReplayBufferFileInfo {
  id: string;
  filePath: string;
}

export class ReplayModule extends Module {
  moduleName = 'Replay';
  permissions = [EApiPermissions.Streaming];

  @Inject() streamingService: StreamingService;

  /**
   * Maps file id to filepath
   */
  availableFiles: Dictionary<string> = {};

  constructor() {
    super();

    this.streamingService.replayBufferStatusChange.subscribe(() => {
      this.stateChanged.next(this.serializeState());
    });

    this.streamingService.replayBufferFileWrite.subscribe(filePath => {
      const id = uuid();
      this.availableFiles[id] = filePath;
      this.fileSaved.next({ id, filePath });
    });
  }

  @apiEvent()
  stateChanged = new Subject<IReplayBufferState>();

  @apiEvent()
  fileSaved = new Subject<IReplayBufferFileInfo>();

  @apiMethod()
  getState(): IReplayBufferState {
    return this.serializeState();
  }

  @apiMethod()
  startBuffer() {
    this.streamingService.startReplayBuffer();
  }

  @apiMethod()
  stopBuffer() {
    this.streamingService.stopReplayBuffer();
  }

  @apiMethod()
  save() {
    this.streamingService.saveReplay();
  }

  @apiMethod()
  getReplayFileContents(ctx: IApiContext, fileId: string) {
    if (!this.availableFiles[fileId]) {
      throw new Error(`The file with id ${fileId} does not exist!`);
    }

    return new FileReturnWrapper(this.availableFiles[fileId]);
  }

  private serializeState(): IReplayBufferState {
    return {
      status: this.streamingService.state.replayBufferStatus,
      statusTime: this.streamingService.state.replayBufferStatusTime,
    };
  }
}
