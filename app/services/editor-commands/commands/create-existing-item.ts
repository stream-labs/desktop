import { Command } from './command';
import { SourcesService } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { DualOutputService } from 'services/dual-output';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { SceneCollectionsService } from 'services/scene-collections';

/**
 * Creates an item from an existing source
 *
 * @remarks
 * For vanilla scenes, just make a copy of the existing item.
 * For dual output scenes, copy the existing item and then copy it again
 * to create both nodes. Do this regardless of whether or not dual output
 * is active.
 *
 * @param sceneId - The id of the scene
 * @param sourceId - The id of the scene item
 */
export class CreateExistingItemCommand extends Command {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  private sceneItemId: string;

  private dualOutputVerticalNodeId: string;

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
      .addSource(this.sourceId, { id: this.sceneItemId, display: 'horizontal' });

    // check the existence of all scene node maps because the scene may not have a
    // node map created for it
    if (this.dualOutputService.views.hasSceneNodeMaps) {
      if (this.dualOutputVerticalNodeId) {
        Promise.resolve(
          this.dualOutputService.actions.return.createOrAssignOutputNode(
            item,
            'vertical',
            false,
            this.sceneId,
            this.dualOutputVerticalNodeId,
          ),
        );
      } else {
        Promise.resolve(
          this.dualOutputService.actions.return.createOrAssignOutputNode(
            item,
            'vertical',
            false,
            this.sceneId,
          ),
        ).then(node => (this.dualOutputVerticalNodeId = node.id));
      }
    }

    this.sceneItemId = item.id;
  }

  rollback() {
    this.scenesService.views.getScene(this.sceneId).removeItem(this.sceneItemId);

    if (this.dualOutputVerticalNodeId) {
      this.scenesService.views.getScene(this.sceneId).removeItem(this.dualOutputVerticalNodeId);
      this.sceneCollectionsService.removeNodeMapEntry(this.sceneId, this.sceneItemId);
    }
  }
}
