import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { RemoveNodesCommand } from './remove-nodes';

export class RemoveSceneCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private sceneName: string;
  private sceneOrder: string[];

  private removeNodesSubcommand: RemoveNodesCommand;

  constructor(private sceneId: string) {
    super();
    this.sceneName = this.scenesService.getScene(this.sceneId).name;
    this.sceneOrder = this.scenesService.state.displayOrder;
  }

  get description() {
    return `Remove ${this.sceneName}`;
  }

  async execute() {
    const scene = this.scenesService.getScene(this.sceneId);

    this.removeNodesSubcommand = new RemoveNodesCommand(scene.getSelection(scene.getNodesIds()));
    await this.removeNodesSubcommand.execute();

    scene.remove();
  }

  async rollback() {
    this.scenesService.createScene(this.sceneName, { sceneId: this.sceneId });
    this.scenesService.setSceneOrder(this.sceneOrder);

    await this.removeNodesSubcommand.rollback();
  }
}
