import { Command } from './command';
import { Inject } from 'services/core/injector';
import { ScenesService } from 'services/scenes';

export class RemoveFolderCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private name: string;
  private childrenIds: string[];

  constructor(private sceneId: string, private folderId: string) {
    super();
  }

  execute() {
    const folder = this.scenesService.getScene(this.sceneId).getFolder(this.folderId);
    this.name = folder.name;
    this.childrenIds = folder.childrenIds;
    folder.ungroup();
  }

  rollback() {
    const scene = this.scenesService.getScene(this.sceneId);
    scene.createFolder(this.name, { id: this.folderId });
    scene.getSelection(this.childrenIds).setParent(this.folderId);
  }
}
