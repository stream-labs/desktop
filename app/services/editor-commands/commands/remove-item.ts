import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { SourcesNode } from 'services/scene-collections/nodes/sources';
import { Source } from 'services/sources';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
import { ISceneItemSettings } from 'services/api/external-api/scenes';
import { DualOutputService } from 'services/dual-output';
import { VideoSettingsService } from 'services/settings-v2';

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
  @Inject() private videoSettingsService: VideoSettingsService;

  private sceneId: string;
  private sourceId: string;
  private sourceReviver: SourceReviver;

  private reorderNodesSubcommand: ReorderNodesCommand;
  private reorderDualOutputNodesSubcommand: ReorderNodesCommand;

  private settings: ISceneItemSettings;

  private dualOutputVerticalNodeId: string;
  private dualOutputNodeSettings: ISceneItemSettings;

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

    // If the scene has vertical nodes, we need to remove the corresponding vertical node
    if (this.dualOutputService.views.hasVerticalNodes) {
      console.log('removing vertical node');
      this.dualOutputVerticalNodeId = this.dualOutputService.views.getDisplayNodeId(
        this.sceneItemId,
      );
      console.log('dualOutputVerticalNodeId ', this.dualOutputVerticalNodeId);
      const verticalSceneItem = this.scenesService.views.getSceneItem(
        this.dualOutputVerticalNodeId,
      );
      this.dualOutputNodeSettings = verticalSceneItem.getSettings();

      console.log('verticalSceneItem ', verticalSceneItem);

      this.reorderDualOutputNodesSubcommand = new ReorderNodesCommand(
        scene.getSelection(this.dualOutputVerticalNodeId),
        void 0,
        EPlaceType.After,
      );
      this.reorderDualOutputNodesSubcommand.execute();

      verticalSceneItem.remove();
      this.dualOutputService.actions.removeDualOutputNodes(this.sceneItemId);
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
    console.log('called');
  }

  async rollback() {
    if (this.sourceReviver) {
      await this.sourceReviver.load({});
    }

    const scene = this.scenesService.views.getScene(this.sceneId);

    if (this.dualOutputVerticalNodeId) {
      // if the scene has vertical node items, restore the vertical nodes as well

      // horizontal scene item
      const item = scene.addSource(this.sourceId, { id: this.sceneItemId, select: false });
      const horizontalContext = this.videoSettingsService.contexts.horizontal;
      item.setSettings({ ...this.settings, output: horizontalContext, display: 'horizontal' });

      // vertical scene item
      const verticalItem = scene.addSource(this.sourceId, {
        id: this.dualOutputVerticalNodeId,
        select: false,
      });
      const verticalContext = this.videoSettingsService.contexts.vertical;
      verticalItem.setSettings({
        ...this.dualOutputNodeSettings,
        output: verticalContext,
        display: 'vertical',
      });

      // reorder both
      this.reorderNodesSubcommand.rollback();
      this.reorderDualOutputNodesSubcommand.rollback();

      // restore entry to node map
      this.dualOutputService.restoreNodesToMap(this.sceneItemId, this.dualOutputVerticalNodeId);
    } else {
      // otherwise, just create horizontal item
      const item = scene.addSource(this.sourceId, { id: this.sceneItemId, select: false });

      this.reorderNodesSubcommand.rollback();
      item.setSettings(this.settings);
    }
  }
}
