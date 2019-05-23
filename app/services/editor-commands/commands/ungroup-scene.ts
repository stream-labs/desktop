import { Command } from './command';
import { Inject } from 'services/core';
import { ScenesService } from 'services/scenes';
import { CopyNodesCommand } from './copy-nodes';
import { RemoveItemCommand } from './remove-item';
import { RemoveSceneCommand } from './remove-scene';

/**
 * This command is a little weird and dangerous, but
 * we support and aren't going to remove it for now.
 * It operates on a scene-as-scene-item and destructively
 * removes the scene, dumping all its items into the currently
 * active scene.  The consequences of this could be pretty
 * dangerous and unexpected if that scene is being used in
 * multiple places, but for now I am just maintaining feature
 * parity.  In the future we should think about better alternatives
 * to this command.
 */
export class UngroupSceneCommand extends Command {
  @Inject() private scenesService: ScenesService;

  description: string;

  private copyNodesSubcommand: CopyNodesCommand;
  private removeItemSubcommand: RemoveItemCommand;
  private removeSceneSubcommand: RemoveSceneCommand;

  constructor(private sourceSceneItemId: string, private destSceneId: string) {
    super();
    const sceneItem = this.scenesService.getSceneItem(sourceSceneItemId);
    this.description = `Ungroup ${sceneItem.name}`;
  }

  async execute() {
    const sourceItem = this.scenesService.getSceneItem(this.sourceSceneItemId);
    const sourceScene = this.scenesService.getScene(sourceItem.sourceId);

    this.copyNodesSubcommand =
      this.copyNodesSubcommand ||
      new CopyNodesCommand(sourceScene.getSelection().selectAll(), this.destSceneId);
    this.copyNodesSubcommand.execute();

    this.removeItemSubcommand = this.removeItemSubcommand || new RemoveItemCommand(sourceItem.id);
    await this.removeItemSubcommand.execute();

    this.removeSceneSubcommand =
      this.removeSceneSubcommand || new RemoveSceneCommand(sourceScene.id);
    await this.removeSceneSubcommand.execute();
  }

  async rollback() {
    await this.removeSceneSubcommand.rollback();
    await this.removeItemSubcommand.rollback();
    await this.copyNodesSubcommand.rollback();
  }
}
