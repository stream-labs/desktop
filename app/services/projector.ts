import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { $t } from './i18n';
import { SourcesService } from './sources';
import { obsEncoderToEncoderFamily } from './settings';
import * as obs from '../../obs-api';

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
    let title = sourceId ? this.sourcesService.getSource(sourceId).name : $t('Output');
    if (sourceId)
      title = this.sourcesService.getSource(sourceId).name;
    else {
      switch(renderingMode) {
        case obs.ERenderingMode.OBS_STREAMING_RENDERING:
          title = $t('Streaming Output');
          break;
        case obs.ERenderingMode.OBS_RECORDING_RENDERING:
          title = $t('Recording Output');
          break;
        case obs.ERenderingMode.OBS_MAIN_RENDERING:
        default:
          title = $t('Output');
          break;
      }
    }
    this.windowsService.createOneOffWindow({
      componentName: 'Projector',
      title: $t('Projector: ') + title,
      queryParams: { sourceId, renderingMode },
      size: {
        width: 640,
        height: 400,
      },
    });
    debugger;
  }
}
