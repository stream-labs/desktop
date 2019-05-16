import { Command } from './command';
import { Selection } from 'services/selection';
import { Inject } from 'services/core/injector';
import { ScenesService } from 'services/scenes';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';

export class CreateFolderCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private folderId: string;
  private moveToFolderSubCommand: ReorderNodesCommand;

  constructor(private sceneId: string, private name: string, private items?: Selection) {
    super();
  }

  get description() {
    return `Create ${this.name}`;
  }

  execute() {
    const folder = this.scenesService
      .getScene(this.sceneId)
      .createFolder(this.name, { id: this.folderId });
    this.folderId = folder.id;

    if (this.items) {
      this.moveToFolderSubCommand = new ReorderNodesCommand(
        this.items,
        folder.id,
        EPlaceType.Inside,
      );
      this.moveToFolderSubCommand.execute();
    }
  }

  rollback() {
    if (this.moveToFolderSubCommand) this.moveToFolderSubCommand.rollback();

    this.scenesService.getScene(this.sceneId).removeFolder(this.folderId);
  }
}
