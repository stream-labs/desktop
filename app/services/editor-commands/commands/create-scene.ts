import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { RemoveNodesCommand } from './remove-nodes';

////////////////////
// TODO: IN PROGRESS
////////////////////

interface ISceneCreateOptions {
  // The following 2 options are mutually exclusive
  duplicateSourcesFromScene?: string;
  groupFromOrigin?: {
    originSceneId: string;
    originItemIds: string[];
  };
}

export class CreateSceneCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private sceneId: string;
  private removeNodesSubcommand: RemoveNodesCommand;

  description: string;

  constructor(private name: string, private options: ISceneCreateOptions = {}) {
    super();
    this.description = `Create ${name}`;
  }

  async execute() {
    const scene = this.scenesService.createScene(this.name, {
      sceneId: this.sceneId,
      duplicateSourcesFromScene: this.options.duplicateSourcesFromScene,
    });
    this.sceneId = scene.id;

    // Move in items from the origin and add the scene back to the origin
    // with a content crop.
    if (this.options.groupFromOrigin) {
      const originScene = this.scenesService.getScene(this.options.groupFromOrigin.originSceneId);
      const originSelection = originScene.getSelection(this.options.groupFromOrigin.originItemIds);

      // Copy these items to the new scene
      originSelection.copyTo(this.sceneId);

      // Add the new scene back to the original and crop it
      const item = originScene.addSource(this.sceneId);
      item.setContentCrop();

      // Remove the items from the origin scene
      this.removeNodesSubcommand = new RemoveNodesCommand(originSelection);
      await this.removeNodesSubcommand.execute();
    }
  }

  async rollback() {
    if (this.options.groupFromOrigin) {
      // Restore the items to the original scene
      await this.removeNodesSubcommand.rollback();
    }

    this.scenesService.removeScene(this.sceneId);
  }
}
