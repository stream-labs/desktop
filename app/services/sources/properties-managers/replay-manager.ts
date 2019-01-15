import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { StreamingService } from 'services/streaming';

export class ReplayManager extends PropertiesManager {
  @Inject() streamingService: StreamingService;

  blacklist: string[] = ['is_local_file', 'local_file'];

  init() {
    this.streamingService.replayBufferFileWrite.subscribe(filePath => {
      this.obsSource.update({ local_file: filePath });
    });
  }
}
