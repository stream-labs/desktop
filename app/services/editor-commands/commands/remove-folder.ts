import { Command } from './command';
import { Inject } from 'services/core/injector';
import { ScenesService } from 'services/scenes';
import { $t } from 'services/i18n';

export class RemoveFolderCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private name: string;
  private childrenIds: string[];
  private parentId: string;

  constructor(private sceneId: string, private folderId: string) {
    super();
  }

  get description() {
    return $t('Remove %{folderName}', { folderName: this.name });
  }

  execute() {
    const folder = this.scenesService.getScene(this.sceneId).getFolder(this.folderId);
    this.name = folder.name;
    this.childrenIds = folder.childrenIds;
    this.parentId = folder.parentId;
    folder.ungroup();
  }

  rollback() {
    const scene = this.scenesService.getScene(this.sceneId);
    const folder = scene.createFolder(this.name, { id: this.folderId });
    scene.getSelection(this.childrenIds).setParent(this.folderId);
    if (this.parentId) folder.setParent(this.parentId);
  }
}
