import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { $t } from './i18n';
import { SourcesService } from './sources';
import { ERenderingMode } from '../../obs-api';

export class ProjectorService extends Service {
  @Inject() windowsService: WindowsService;
  @Inject() sourcesService: SourcesService;

  /**
   * Create a new projector window.
   * If source is omitted, it will create a projector
   * of the main output.
   * @param renderingMode  The rendering mode
   * @param sourceId       The id of the source
   */
  createProjector(renderingMode: number, sourceId?: string) {
    let title = sourceId ? this.sourcesService.views.getSource(sourceId).name : $t('Output');
    if (renderingMode === ERenderingMode.OBS_STREAMING_RENDERING) title = $t('Streaming Output');
    if (renderingMode === ERenderingMode.OBS_RECORDING_RENDERING) title = $t('Recording Output');

    this.windowsService.createOneOffWindow({
      componentName: 'Projector',
      title: $t('Projector: ') + title,
      queryParams: { sourceId, renderingMode },
      size: {
        width: 640,
        height: 400,
        minWidth: 640,
        minHeight: 400,
      },
    });
  }
}
