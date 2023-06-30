import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { SourcesNode } from 'services/scene-collections/nodes/sources';
import { Source } from 'services/sources';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
import { ISceneItemSettings } from 'services/api/external-api/scenes';
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
  @Inject() private videoSettingsService: VideoSettingsService;

  private sceneId: string;
  private sourceId: string;
  private sourceReviver: SourceReviver;

  private reorderNodesSubcommand: ReorderNodesCommand;

  private settings: ISceneItemSettings;

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

    item.remove();
  }

  async rollback() {
    if (this.sourceReviver) {
      await this.sourceReviver.load({});
    }

    const scene = this.scenesService.views.getScene(this.sceneId);

    const item = scene.addSource(this.sourceId, { id: this.sceneItemId, select: false });
    const display = item.display ?? 'horizontal';
    const context = this.videoSettingsService.contexts[display];
    item.setSettings({
      ...this.settings,
      output: context,
      display,
    });

    this.reorderNodesSubcommand.rollback();
  }
}
