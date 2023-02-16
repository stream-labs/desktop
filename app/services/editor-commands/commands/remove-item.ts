import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { SourcesNode } from 'services/scene-collections/nodes/sources';
import { Source } from 'services/sources';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
import { ISceneItemSettings } from 'services/api/external-api/scenes';
import { DualOutputService } from 'services/dual-output';
import { TDisplayType } from 'services/settings-v2/video';

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

export class RemoveItemCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;

  private sceneId: string;
  private sourceId: string;
  private sourceReviver: SourceReviver;

  private reorderNodesSubcommand: ReorderNodesCommand;

  private settings: ISceneItemSettings;
  private dualOutputNodeData: { id: string; display: TDisplayType }[];

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

    // if (this.dualOutputService.views.dualOutputMode) {
    //   // this.dualOutputNodeData = [];
    //   // if the item was removed in dual output mode
    //   // we need to destroy the dual output nodes as well
    //   const { nodeMaps } = this.dualOutputService.views;
    //   console.log('remove nodeMaps ', nodeMaps);
    //   for (const display in nodeMaps) {
    //     // this.dualOutputNodeData.push({
    //     //   id: nodeMaps[display][this.sceneItemId],
    //     //   display: display as TDisplayType,
    //     // });
    //     const nodeId = nodeMaps[display][this.sceneItemId];
    //     this.scenesService.views.getScene(this.sceneId).removeItem(nodeId);
    //   }
    //   // this.dualOutputNodeData.forEach(dualOutputNode => {
    //   //   const node = this.scenesService.views.getSceneItem(dualOutputNode.id);
    //   //   node.remove();
    //   // });
    //   this.dualOutputService.actions.removeDualOutputNodes(this.sceneItemId);
    // }

    item.remove();
  }

  async rollback() {
    if (this.sourceReviver) {
      await this.sourceReviver.load({});
    }

    const scene = this.scenesService.views.getScene(this.sceneId);

    const item = scene.addSource(this.sourceId, { id: this.sceneItemId, select: false });

    this.reorderNodesSubcommand.rollback();
    item.setSettings(this.settings);

    if (this.dualOutputNodeData.length) {
      // if the scene item was deleted in dual output mode
      // restore the dual output scene items as well
      // the scene item id doesn't matter for the dualOutputNodes
      // so just create new ones
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
}
