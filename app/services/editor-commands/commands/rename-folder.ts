import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';

export class RenameFolderCommand extends Command {
  @Inject() scenesService: ScenesService;

  private oldName: string;

  constructor(private sceneId: string, private folderId: string, private name: string) {
    super();
  }

  get description() {
    return `Rename ${this.oldName}`;
  }

  execute() {
    const folder = this.scenesService.getScene(this.sceneId).getFolder(this.folderId);
    this.oldName = folder.name;
    folder.setName(this.name);
  }

  rollback() {
    this.scenesService
      .getScene(this.sceneId)
      .getFolder(this.folderId)
      .setName(this.oldName);
  }
}
