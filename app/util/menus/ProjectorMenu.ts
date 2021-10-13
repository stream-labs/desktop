import { Menu } from './Menu';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n';
import { ProjectorService } from 'services/projector';
import { ERenderingMode } from '../../../obs-api';
import { StreamingService } from 'services/streaming';
import { SelectionService } from 'services/selection';

export class ProjectorMenu extends Menu {
  @Inject() private projectorService: ProjectorService;
  @Inject() private streamingService: StreamingService;
  @Inject() private selectionService: SelectionService;

  constructor() {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    const selectedItem = this.selectionService.views.globalSelection.getItems()[0];

    if (selectedItem) {
      this.append({
        label: $t('Create Source Projector'),
        click: () => {
          this.projectorService.createProjector(
            ERenderingMode.OBS_MAIN_RENDERING,
            selectedItem.sourceId,
          );
        },
      });
    }

    this.append({
      label: $t('Create Output Projector'),
      click: () => this.projectorService.createProjector(ERenderingMode.OBS_MAIN_RENDERING),
    });

    if (this.streamingService.state.selectiveRecording) {
      this.append({
        label: $t('Create Stream Output Projector'),
        click: () => this.projectorService.createProjector(ERenderingMode.OBS_STREAMING_RENDERING),
      });

      this.append({
        label: $t('Create Recording Output Projector'),
        click: () => this.projectorService.createProjector(ERenderingMode.OBS_RECORDING_RENDERING),
      });
    }
  }
}
