import { Command } from './command';
import { Selection } from 'services/selection';
import { Inject } from 'services/core/injector';
import { ScenesService } from 'services/scenes';
import { ReorderItemsCommand, EPlaceType } from './reorder-items';

export class CreateFolderCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private folderId: string;
  private moveToFolderSubCommand: ReorderItemsCommand;

  constructor(private sceneId: string, private name: string, private items?: Selection) {
    super();
  }

  execute() {
    const folder = this.scenesService
      .getScene(this.sceneId)
      .createFolder(this.name, { id: this.folderId });
    this.folderId = folder.id;

    if (this.items) {
      this.moveToFolderSubCommand = new ReorderItemsCommand(
        this.items,
        folder.id,
        EPlaceType.Inside,
      );
    }
  }

  rollback() {
    if (this.moveToFolderSubCommand) this.moveToFolderSubCommand.rollback();

    this.scenesService.getScene(this.sceneId).removeFolder(this.folderId);
  }
}
