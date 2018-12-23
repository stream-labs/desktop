import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { StreamingService } from 'services/streaming';

export class ReplayManager extends PropertiesManager {
  @Inject() streamingService: StreamingService;

  init() {
    console.log('init replay');
    console.log(this.obsSource.settings);

    this.streamingService.replayBufferFileWrite.subscribe(filePath => {
      this.obsSource.update({ local_file: filePath });
    });
  }
}
