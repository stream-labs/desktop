import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { SourcesNode } from 'services/scene-collections/nodes/sources';
import { Source } from 'services/sources';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
import { ISceneItemSettings } from 'services/api/external-api/scenes';
import { DualOutputService } from 'services/dual-output';
import { SceneCollectionsService } from 'services/scene-collections';

// Removing and recreating a source is a very complex event.
// We can save a lot of time by leveraging the scene collection system.
// This operation isn't very fast but it keeps things DRY.
// Hacky? Yes. Easy? Yes. Problems? Probably.
class SourceReviver extends SourcesNode {
  constructor(private source: Source) {
    super();
  }

  getItems() {
    return [this.source];
  }
}
/**
 * Removes an item
 *
 * @remarks
 * For both vanilla and dual output scenes, remove a single scene item.
 *
 * @param sceneItemId - The scene item id
 */
export class RemoveItemCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  private sceneId: string;
  private sourceId: string;
  private sourceReviver: SourceReviver;

  private reorderNodesSubcommand: ReorderNodesCommand;

  private settings: ISceneItemSettings;

  // data for dual output
  private dualOutputVerticalSceneItemId: string;
  private dualOutputVerticalSceneSourceId: string;
  private dualOutputVerticalReorderNodesSubcommand: ReorderNodesCommand;

  constructor(private sceneItemId: string) {
    super();
  }

  get description() {
    return $t('Remove %{sourceName}', {
      sourceName: this.scenesService.views.getSceneItem(this.sceneItemId).name,
    });
  }

  async execute() {
    const item = this.scenesService.views.getSceneItem(this.sceneItemId);

    const scene = this.scenesService.views.getScene(item.sceneId);
    this.sceneId = item.sceneId;
    this.sourceId = item.sourceId;

    this.settings = item.getSettings();

    // Save even more work by moving this item top the top of the
    // stack and then rolling it back to restore.
    this.reorderNodesSubcommand = new ReorderNodesCommand(
      scene.getSelection(this.sceneItemId),
      void 0,
      EPlaceType.After,
    );
    this.reorderNodesSubcommand.execute();

    // For dual output, handle removing the vertical-scene-source for the partner vertical scene-as-scene-item
    if (this.dualOutputService.views.hasNodeMap(this.sceneId)) {
      const dualOutputVerticalSceneItemId = this.dualOutputService.views.getVerticalNodeId(
        this.sceneItemId,
      );

      if (dualOutputVerticalSceneItemId) {
        console.log('this.dualOutputVerticalSceneItemId', this.dualOutputVerticalSceneItemId);
        const dualOutputVerticalSceneItem = this.scenesService.views.getSceneItem(
          dualOutputVerticalSceneItemId,
        );
        console.log(
          'dualOutputVerticalSceneItem',
          JSON.stringify(dualOutputVerticalSceneItem, null, 2),
        );

        if (dualOutputVerticalSceneItem) {
          this.dualOutputVerticalReorderNodesSubcommand = new ReorderNodesCommand(
            scene.getSelection(this.dualOutputVerticalSceneItemId),
            void 0,
            EPlaceType.After,
          );
          this.dualOutputVerticalReorderNodesSubcommand.execute();

          dualOutputVerticalSceneItem.remove();

          // if this scene item uses a scene as its source, we need to remove the partner vertical-scene-source created
          // to render the horizontal scene-as-scene-item's source in the vertical display.
          if (item?.type === 'scene') {
            // get the scene that is the source for the horizontal scene-as-scene-item

            this.dualOutputVerticalSceneSourceId = dualOutputVerticalSceneItem?.sourceId;

            // remove the partner-vertical-scene-source
            const verticalSceneSource = this.scenesService.views.getScene(
              this.dualOutputVerticalSceneSourceId,
            );

            if (verticalSceneSource) {
              verticalSceneSource.remove();
              this.sceneCollectionsService.removeNodeMap(this.dualOutputVerticalSceneSourceId);
            }
          }
        }

        // remove entry regardless
        this.sceneCollectionsService.removeNodeMapEntry(this.sceneId, this.sceneItemId);
      }
    }

    // If this was the last item using this source, the underlying source
    // will automatically be removed. In this case, we need to store enough
    // information to bring it back intio existence in the rollback function.
    if (
      this.scenesService.getSourceItemCount(item.sourceId) === 1 &&
      item.source.type !== 'scene'
    ) {
      this.sourceReviver = new SourceReviver(item.source);
      await this.sourceReviver.save({});
    }

    item.remove();
  }

  async rollback() {
    if (this.sourceReviver) {
      await this.sourceReviver.load({});
    }

    const scene = this.scenesService.views.getScene(this.sceneId);

    const horizontalItem = scene.addSource(this.sourceId, {
      id: this.sceneItemId,
      select: false,
      display: this.settings?.display,
    });

    if (this.dualOutputVerticalSceneItemId) {
      if (this.dualOutputVerticalSceneSourceId) {
        this.scenesService.createDualOutputSceneSourceSceneItem(
          this.sceneId,
          this.sourceId,
          this.sceneItemId,
          this.dualOutputVerticalSceneItemId,
        );
      } else {
        Promise.resolve(
          this.dualOutputService.actions.return.createOrAssignOutputNode(
            horizontalItem,
            'vertical',
            false,
            this.sceneId,
            this.dualOutputVerticalSceneItemId,
          ),
        );

        if (this.dualOutputVerticalReorderNodesSubcommand) {
          this.dualOutputVerticalReorderNodesSubcommand.rollback();
        }
      }

      this.reorderNodesSubcommand.rollback();
    }
  }
}
