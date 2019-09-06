import { Command } from './command';
import { $t } from 'services/i18n';
import { CreateNewItemCommand } from './create-new-item';
import { Inject } from '../../core';
import { ScenesService } from '../../scenes';
import { CreateFolderCommand } from './create-folder';
import { RemoveNodesCommand } from './remove-nodes';

export class AddFilesCommand extends Command {
  @Inject() private scenesService: ScenesService;
  private addNodesSubCommands: (CreateNewItemCommand | CreateFolderCommand)[];
  private removeNodesSubCommand: RemoveNodesCommand;

  constructor(private sceneId: string, private files: string[]) {
    super();
  }

  get description() {
    return $t('Add files');
  }

  execute() {
    const scene = this.scenesService.getScene(this.sceneId);

    // initial executing
    if (!this.addNodesSubCommands) {
      const currentItemsSelection = scene.getSelection().selectAll();
      this.files.map(file => scene.addFile(file));
      const addedNodes = currentItemsSelection.getInverted();
      this.addNodesSubCommands = addedNodes.map(node => {
        if (node.isItem()) {
          const source = node.getSource();
          return new CreateNewItemCommand(
            this.sceneId,
            source.name,
            source.type,
            source.getSettings(),
            {
              id: node.id,
              sourceAddOptions: { sourceId: source.sourceId },
            },
          );
        }
        return new CreateFolderCommand(this.sceneId, node.name);
      });
      this.removeNodesSubCommand = new RemoveNodesCommand(scene.getSelection(addedNodes));
    } else {
      // redo logic
      this.addNodesSubCommands.forEach(cmd => cmd.execute());
    }
  }

  async rollback() {
    await this.removeNodesSubCommand.execute();
  }
}
