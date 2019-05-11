import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { $t } from './i18n';
import { SourcesService } from './sources';

export class ProjectorService extends Service {
  @Inject() windowsService: WindowsService;
  @Inject() sourcesService: SourcesService;

  /**
   * Create a new projector window.
   * If source is omitted, it will create a projector
   * of the main output.
   * @param sourceId The id of the source
   */
  createProjector(sourceId?: string) {
    const title = sourceId ? this.sourcesService.getSource(sourceId).name : $t('Output');
    this.windowsService.createOneOffWindow({
      componentName: 'Projector',
      title: $t('Projector: ') + title,
      queryParams: { sourceId },
      size: {
        width: 640,
        height: 400,
      },
    });
  }
}
