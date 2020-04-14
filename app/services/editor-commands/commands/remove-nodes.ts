import { Command } from './command';
import { Selection } from 'services/selection';
import { RemoveFolderCommand } from './remove-folder';
import { RemoveItemCommand } from './remove-item';
import { $t } from 'services/i18n';

export class RemoveNodesCommand extends Command {
  private removeFolderSubCommands: RemoveFolderCommand[];
  private removeItemSubCommands: RemoveItemCommand[];

  private selectionName: string;
  private nodeOrder: string[];

  constructor(private selection: Selection) {
    super();
    this.selectionName = this.selection.getNodes()[0].name;
  }

  get description() {
    return $t('Remove %{sourceName}', { sourceName: this.selectionName });
  }

  async execute() {
    this.removeFolderSubCommands = [];
    this.removeItemSubCommands = [];

    this.nodeOrder = this.selection.getScene().getNodesIds();

    this.selection.getFolders().forEach(folder => {
      const subCommand = new RemoveFolderCommand(this.selection.sceneId, folder.id);
      subCommand.execute();
      this.removeFolderSubCommands.push(subCommand);
    });

    for (const item of this.selection.getItems()) {
      const subCommand = new RemoveItemCommand(item.id);
      await subCommand.execute();
      this.removeItemSubCommands.push(subCommand);
    }
  }

  async rollback() {
    for (const itemCommand of [...this.removeItemSubCommands].reverse()) {
      await itemCommand.rollback();
    }

    [...this.removeFolderSubCommands].reverse().forEach(cmd => cmd.rollback());

    this.selection.getScene().setNodesOrder(this.nodeOrder);
  }
}
