import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { RemoveNodesCommand } from './remove-nodes';
import { $t } from 'services/i18n';
import { RemoveItemCommand } from './remove-item';

export class RemoveSceneCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private sceneName: string;
  private sceneOrder: string[];

  private removeNodesSubcommand: RemoveNodesCommand;
  private removeItemSubcommands: RemoveItemCommand[];

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

    // Remove this scene from any other scenes
    this.removeItemSubcommands = [];

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

    scene.remove();
  }

  async rollback() {
    this.scenesService.createScene(this.sceneName, { sceneId: this.sceneId });
    this.scenesService.setSceneOrder(this.sceneOrder.slice());

    if (this.removeNodesSubcommand) await this.removeNodesSubcommand.rollback();

    for (const command of this.removeItemSubcommands) {
      await command.rollback();
    }
  }
}
