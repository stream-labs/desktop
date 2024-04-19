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

  private dualOutputVerticalSceneItemId: string;

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

    this.sceneItemId = item.id;

    // check the existence of all scene node maps because the scene may not have a
    // node map created for it
    if (this.dualOutputService.views.hasSceneNodeMaps) {
      if (item.type === 'scene') {
        this.dualOutputVerticalSceneItemId = this.scenesService.createDualOutputSceneSourceSceneItem(
          this.sceneId,
          this.sourceId,
          this.sceneItemId,
          this.dualOutputVerticalSceneItemId,
        )?.id;
      } else {
        if (this.dualOutputVerticalSceneItemId) {
          Promise.resolve(
            this.dualOutputService.actions.return.createOrAssignOutputNode(
              item,
              'vertical',
              false,
              this.sceneId,
              this.dualOutputVerticalSceneItemId,
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
          ).then(node => (this.dualOutputVerticalSceneItemId = node.id));
        }
      }
    }
  }

  rollback() {
    // rollback vertical scene item first in case the scene is a source for a
    // scene-as-scene-item
    if (this.dualOutputVerticalSceneItemId) {
      const dualOutputSceneItem = this.scenesService.views
        .getScene(this.sceneId)
        .getItem(this.dualOutputVerticalSceneItemId);

      // remove vertical scene item from scene
      this.scenesService.views
        .getScene(this.sceneId)
        .removeItem(this.dualOutputVerticalSceneItemId);

      // if the type is a scene, this is a vertical scene-as-scene-item
      // so also remove the vertical-scene-source
      if (dualOutputSceneItem.type === 'scene') {
        this.scenesService.removeScene(dualOutputSceneItem.sourceId);
        this.sceneCollectionsService.removeNodeMap(dualOutputSceneItem.sourceId);
      }

      this.sceneCollectionsService.removeNodeMapEntry(this.sceneId, this.sceneItemId);
    }

    this.scenesService.views.getScene(this.sceneId).removeItem(this.sceneItemId);
  }
}
