import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { RemoveNodesCommand } from './remove-nodes';
import { CopyNodesCommand } from './copy-nodes';
import { Selection } from 'services/selection';

////////////////////
// TODO: IN PROGRESS
////////////////////

export interface ISceneCreateOptions {
  // The following 2 options are mutually exclusive
  duplicateItemsFromScene?: string;
  groupFromOrigin?: {
    originSceneId: string;
    originItemIds: string[];
  };
}

export class CreateSceneCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private sceneId: string;
  private removeNodesSubcommand: RemoveNodesCommand;
  private copyNodesSubcommand: CopyNodesCommand;

  description: string;

  constructor(private name: string, private options: ISceneCreateOptions = {}) {
    super();
    this.description = `Create ${name}`;
  }

  async execute() {
    const scene = this.scenesService.createScene(this.name, {
      sceneId: this.sceneId,
    });
    this.sceneId = scene.id;

    let nodesToCopy: Selection;

    if (this.options.duplicateItemsFromScene) {
      nodesToCopy = this.scenesService
        .getScene(this.options.duplicateItemsFromScene)
        .getSelection()
        .selectAll();
    }

    if (this.options.groupFromOrigin) {
      nodesToCopy = this.scenesService
        .getScene(this.options.groupFromOrigin.originSceneId)
        .getSelection(this.options.groupFromOrigin.originItemIds);
    }

    if (nodesToCopy) {
      this.copyNodesSubcommand =
        this.copyNodesSubcommand || new CopyNodesCommand(nodesToCopy, this.sceneId);
      this.copyNodesSubcommand.execute();
    }

    if (this.options.groupFromOrigin) {
      const originScene = this.scenesService.getScene(this.options.groupFromOrigin.originSceneId);
      const originSelection = originScene.getSelection(this.options.groupFromOrigin.originItemIds);

      const item = originScene.addSource(this.sceneId);
      item.setContentCrop();

      this.removeNodesSubcommand = new RemoveNodesCommand(originSelection);
      await this.removeNodesSubcommand.execute();
    }

    return scene.id;
  }

  async rollback() {
    if (this.options.groupFromOrigin) {
      // Restore the items to the original scene
      await this.removeNodesSubcommand.rollback();
    }

    if (this.copyNodesSubcommand) this.copyNodesSubcommand.rollback();

    this.scenesService.removeScene(this.sceneId);
  }
}
