import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';

export class ProjectorService extends Service {
  @Inject() windowsService: WindowsService;

  createProjector() {
    this.windowsService.createOneOffWindow({ componentName: 'Projector' });
  }
}
