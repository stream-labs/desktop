import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';

export class ProjectorService extends Service {
  @Inject() windowsService: WindowsService;

  /**
   * Create a new projector window.
   * If source is omitted, it will create a projector
   * of the main output.
   * @param sourceId The id of the source
   */
  createProjector(sourceId?: string) {
    this.windowsService.createOneOffWindow({
      componentName: 'Projector',
      queryParams: { sourceId },
      size: {
        width: 640,
        height: 400
      }
    });
  }
}
