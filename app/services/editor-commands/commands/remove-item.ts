import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { SourcesNode } from 'services/scene-collections/nodes/sources';
import { Source } from 'services/sources';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
import { ISceneItemSettings } from 'services/api/external-api/scenes';
import { DualOutputService } from 'services/dual-output';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2';
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

export class RemoveItemCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  private sceneId: string;
  private sourceId: string;
  private sourceReviver: SourceReviver;

  private reorderNodesSubcommand: ReorderNodesCommand;
  private reorderDualOutputNodesSubcommand: ReorderNodesCommand;

  private settings: ISceneItemSettings;

  // the dual output node is the correllating node in a scene
  // that has both horizontal and vertical nodes
  private dualOutputNodeId: string;
  private dualOutputNodeSettings: ISceneItemSettings;
  private dualOutputNodeDisplay: TDisplayType;

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

    // when removing a scene, the vertical node will have already been removed
    // so this prevent an error by just return
    if (!item) return;

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

    // If the scene has vertical nodes, remove the corresponding vertical node
    if (this.dualOutputService.views.hasNodeMap()) {
      this.dualOutputNodeDisplay = this.dualOutputService.views.getVerticalNodeId(this.sceneItemId)
        ? 'horizontal'
        : 'vertical';

      this.dualOutputNodeId =
        this.dualOutputNodeDisplay === 'horizontal'
          ? this.dualOutputService.views.getVerticalNodeId(this.sceneItemId)
          : this.dualOutputService.views.getHorizontalNodeId(this.sceneItemId, this.sceneId);

      const dualOutputSceneItem = this.scenesService.views.getSceneItem(this.dualOutputNodeId);
      this.dualOutputNodeSettings = dualOutputSceneItem.getSettings();

      this.reorderDualOutputNodesSubcommand = new ReorderNodesCommand(
        scene.getSelection(this.dualOutputNodeId),
        void 0,
        EPlaceType.After,
      );

      this.reorderDualOutputNodesSubcommand.execute();

      dualOutputSceneItem.remove();

      const nodeToRemoveId =
        this.dualOutputNodeDisplay === 'horizontal' ? this.sceneItemId : this.dualOutputNodeId;

      this.sceneCollectionsService.removeVerticalNode(nodeToRemoveId, this.sceneId);
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

    if (this.dualOutputNodeId) {
      // if the scene has vertical node items, restore both the horizontal and vertical nodes
      const horizontalNodeId =
        this.dualOutputNodeDisplay === 'horizontal' ? this.sceneItemId : this.dualOutputNodeId;
      const verticalNodeId =
        this.dualOutputNodeDisplay === 'horizontal' ? this.dualOutputNodeId : this.sceneItemId;

      const horizontalSettings =
        this.dualOutputNodeDisplay === 'horizontal' ? this.settings : this.dualOutputNodeSettings;
      const verticalSettings =
        this.dualOutputNodeDisplay === 'horizontal' ? this.dualOutputNodeSettings : this.settings;

      // vertical scene item
      const verticalItem = scene.addSource(this.sourceId, { id: verticalNodeId, select: false });
      const verticalContext = this.videoSettingsService.contexts.vertical;
      verticalItem.setSettings({
        ...verticalSettings,
        output: verticalContext,
        display: 'vertical',
      });

      // horizontal scene item
      const horizontalItem = scene.addSource(this.sourceId, {
        id: horizontalNodeId,
        select: false,
      });
      const horizontalContext = this.videoSettingsService.contexts.horizontal;
      horizontalItem.setSettings({
        ...horizontalSettings,
        output: horizontalContext,
        display: 'horizontal',
      });

      // reorder both
      this.reorderNodesSubcommand.rollback();
      this.reorderDualOutputNodesSubcommand.rollback();

      // restore entry to node map
      this.sceneCollectionsService.createNodeMapEntry(
        this.sceneId,
        horizontalNodeId,
        verticalNodeId,
      );
    } else {
      // otherwise, just create horizontal item
      const item = scene.addSource(this.sourceId, { id: this.sceneItemId, select: false });

      this.reorderNodesSubcommand.rollback();
      item.setSettings(this.settings);
    }
  }
}
