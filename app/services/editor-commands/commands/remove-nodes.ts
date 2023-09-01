import { Command } from './command';
import { Selection } from 'services/selection';
import { RemoveFolderCommand } from './remove-folder';
import { RemoveItemCommand } from './remove-item';
import { DualOutputService } from 'services/dual-output';
import { SceneCollectionsService } from 'services/scene-collections';
import { $t } from 'services/i18n';
import { Inject } from 'services/core';

/**
 * Removes scene item nodes
 *
 * @remarks
 * This leverages the remove folder and remove item editor commands.
 * For dual output scenes, remove both the horizontal and vertical nodes
 * and remove the scene node map entry.
 *
 * @param selection - The selection of nodes
 */
export class RemoveNodesCommand extends Command {
  private removeFolderSubCommands: RemoveFolderCommand[];
  private removeItemSubCommands: RemoveItemCommand[];
  @Inject() dualOutputService: DualOutputService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  private selectionName: string;
  private nodeOrder: string[];
  private nodeMapEntries: Dictionary<string>;

  constructor(private selection: Selection) {
    super();
    this.selection.freeze();
    this.selectionName = this.selection.getNodes()[0].name;
  }

  get description() {
    return $t('Remove %{sourceName}', { sourceName: this.selectionName });
  }

  async execute() {
    this.removeFolderSubCommands = [];
    this.removeItemSubCommands = [];

    this.nodeOrder = this.selection.getScene().getNodesIds();

    const hasNodeMap = this.dualOutputService.views.hasSceneNodeMaps;

    this.selection.getFolders().forEach(folder => {
      if (
        hasNodeMap &&
        this.dualOutputService.views.getVerticalNodeId(folder.id, this.selection.sceneId)
      ) {
        // save node map entries to restore them when rolling back
        // to prevent duplicates, only save when encountering a horizontal node

        this.nodeMapEntries = {
          ...this.nodeMapEntries,
          [folder.id]: this.dualOutputService.views.getVerticalNodeId(
            folder.id,
            this.selection.sceneId,
          ),
        };

        this.sceneCollectionsService.removeNodeMapEntry(this.selection.sceneId, folder.id);
      }

      const subCommand = new RemoveFolderCommand(this.selection.sceneId, folder.id);
      subCommand.execute();
      this.removeFolderSubCommands.push(subCommand);
    });

    for (const item of this.selection.getItems()) {
      const verticalNodeId = this.dualOutputService.views.getVerticalNodeId(
        item.id,
        this.selection.sceneId,
      );
      if (item?.display === 'horizontal') {
        const subCommand = new RemoveItemCommand(item.id, verticalNodeId);
        await subCommand.execute();
        this.removeItemSubCommands.push(subCommand);
      }
    }
  }

  async rollback() {
    for (const itemCommand of [...this.removeItemSubCommands].reverse()) {
      await itemCommand.rollback();
    }

    [...this.removeFolderSubCommands].reverse().forEach(cmd => cmd.rollback());

    this.selection.getScene().setNodesOrder(this.nodeOrder);

    // restore node map for folders for dual output scenes
    if (this.nodeMapEntries) {
      const sceneId = this.selection.sceneId;

      Object.keys(this.nodeMapEntries).forEach(horizontalNodeId => {
        this.sceneCollectionsService.createNodeMapEntry(
          sceneId,
          horizontalNodeId,
          this.nodeMapEntries[horizontalNodeId],
        );
      });
    }
  }
}
