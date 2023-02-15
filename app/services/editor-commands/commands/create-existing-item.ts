import { Command } from './command';
import { SourcesService } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { DualOutputService } from 'services/dual-output';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { TDisplayType } from 'services/settings-v2/video';

/**
 * Creates an item from an existing source
 */
export class CreateExistingItemCommand extends Command {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;

  private sceneItemId: string;

  private dualOutputNodeData: { id: string; display: TDisplayType }[];

  description: string;

  constructor(private sceneId: string, private sourceId: string) {
    super();
    this.description = $t('Create %{sourceName}', {
      sourceName: this.sourcesService.views.getSource(this.sourceId).name,
    });
  }

  execute() {
    const item = this.scenesService.views
      .getScene(this.sceneId)
      .addSource(this.sourceId, { id: this.sceneItemId });

    this.sceneItemId = item.id;

    if (this.dualOutputService.views.dualOutputMode) {
      this.dualOutputNodeData = [];

      ['horizontal', 'vertical'].map((display: TDisplayType, index: number) => {
        Promise.resolve(
          this.dualOutputService.actions.return.createOrAssignOutputNode(
            item,
            display,
            index === 0,
            this.sceneId,
          ),
        ).then(id => this.dualOutputNodeData.push({ id, display }));
      });
    }
  }

  rollback() {
    this.scenesService.views.getScene(this.sceneId).removeItem(this.sceneItemId);

    if (this.dualOutputService.views.dualOutputMode) {
      this.dualOutputNodeData.map(node => {
        this.scenesService.views.getScene(this.sceneId).removeItem(node.id);
      });
    }
  }
}
