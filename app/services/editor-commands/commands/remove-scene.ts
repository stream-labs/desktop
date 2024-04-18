import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { RemoveNodesCommand } from './remove-nodes';
import { $t } from 'services/i18n';
import { RemoveItemCommand } from './remove-item';
import { DualOutputService } from 'services/dual-output';
import { SceneCollectionsService } from 'services/scene-collections';

/**
 * Removes a scene
 *
 * @remarks
 * This leverages the remove item and remove nodes editor commands.
 * For dual output scenes, also remove the scene node map.
 *
 * @param sceneId - The scene id
 */
export class RemoveSceneCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  private sceneName: string;
  private sceneOrder: string[];
  private hasSceneNodeMap: boolean;

  private removeNodesSubcommand: RemoveNodesCommand;
  private removeItemSubcommands: RemoveItemCommand[];

  // used when rolling back
  private dualOutputSceneSourceId: string;

  constructor(private sceneId: string) {
    super();
    this.sceneName = this.scenesService.views.getScene(this.sceneId).name;
    this.sceneOrder = this.scenesService.state.displayOrder.slice();
  }

  get description() {
    return $t('Remove %{sceneName}', { sceneName: this.sceneName });
  }

  async execute() {
    const scene = this.scenesService.views.getScene(this.sceneId);

    // if this is a dual output collection, the scene may have a partner vertical scene
    // for rendering a scene source in the vertical display, so also remove this vertical scene
    if (scene?.dualOutputSceneSourceId) {
      this.dualOutputSceneSourceId = scene.dualOutputSceneSourceId;

      const verticalSceneSource = this.scenesService.views.getScene(this.dualOutputSceneSourceId);

      if (verticalSceneSource) {
        this.sceneCollectionsService.removeNodeMap(this.dualOutputSceneSourceId);
        verticalSceneSource.remove();
      }
    }

    // Remove this scene from any other scenes
    this.removeItemSubcommands = [];

    this.hasSceneNodeMap = this.dualOutputService.views.hasNodeMap(this.sceneId);

    for (const item of this.scenesService.views.getSceneItemsBySourceId(this.sceneId)) {
      const command = new RemoveItemCommand(item.id);
      await command.execute();
      this.removeItemSubcommands.push(command);
    }

    // Remove all nodes from this scene
    if (scene.getNodesIds().length) {
      this.removeNodesSubcommand = new RemoveNodesCommand(scene.getSelection(scene.getNodesIds()));
      await this.removeNodesSubcommand.execute();
    }

    // remove scene node map from collection
    if (this.hasSceneNodeMap) {
      this.sceneCollectionsService.removeNodeMap(scene.id);
    }

    scene.remove();
  }

  async rollback() {
    this.scenesService.createScene(this.sceneName, {
      sceneId: this.sceneId,
      dualOutputSceneSourceId: this.dualOutputSceneSourceId,
      sceneType: 'scene',
    });
    this.scenesService.setSceneOrder(this.sceneOrder.slice());

    // restore dual output scene node map
    if (this.hasSceneNodeMap) {
      this.sceneCollectionsService.restoreNodeMap(this.sceneId);
    }

    // restore scene items
    for (const command of this.removeItemSubcommands) {
      await command.rollback();
    }

    // if necessary, restore vertical-scene-source
    if (this.dualOutputSceneSourceId) {
      this.scenesService.createDualOutputSceneSource(this.sceneId);
    }
  }
}
