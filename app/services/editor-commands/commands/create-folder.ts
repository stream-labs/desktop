import { Command } from './command';
import { Selection } from 'services/selection';
import { Inject } from 'services/core/injector';
import { ScenesService, TSceneNode } from 'services/scenes';
import { ReorderNodesCommand, EPlaceType } from './reorder-nodes';
import { $t } from 'services/i18n';
import { DualOutputService } from 'services/dual-output';
import { SceneCollectionsService } from 'services/scene-collections';

export class CreateFolderCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  private folderId: string;
  private moveToFolderSubCommand: ReorderNodesCommand;

  private verticalFolderId: string;
  private dualOutputModeToFolderSubCommand: ReorderNodesCommand;

  constructor(private sceneId: string, private name: string, private items?: Selection) {
    super();
    if (this.items) this.items.freeze();
  }

  get description() {
    return $t('Create %{folderName}', { folderName: this.name });
  }

  execute() {
    const scene = this.scenesService.views.getScene(this.sceneId);
    const folder = scene.createFolder(this.name, { id: this.folderId });
    folder.setDisplay('horizontal');
    this.folderId = folder.id;

    // if the scene has dual output nodes, create the dual output folder
    if (this.dualOutputService.views.hasNodeMap(this.sceneId)) {
      const verticalFolder = scene.createFolder(this.name, { id: this.verticalFolderId });
      verticalFolder.setDisplay('vertical');
      this.verticalFolderId = verticalFolder.id;

      this.sceneCollectionsService.createNodeMapEntry(
        this.sceneId,
        this.folderId,
        this.verticalFolderId,
      );
    }

    if (this.items) {
      // if the scene has dual output nodes filter the nodes by display
      // and move them into their respective folders
      if (this.verticalFolderId) {
        const verticalNodes: TSceneNode[] = [];
        const horizontalNodes: TSceneNode[] = [];
        this.items.getNodes().forEach(node => {
          if (this.dualOutputService.views.verticalNodeIds.includes(node.id)) {
            verticalNodes.push(node);
          } else {
            horizontalNodes.push(node);
          }
        });

        const verticalSelection = scene.getSelection(verticalNodes);
        const horizontalSelection = scene.getSelection(horizontalNodes);

        this.moveToFolderSubCommand = new ReorderNodesCommand(
          horizontalSelection,
          folder.id,
          EPlaceType.Inside,
        );
        this.moveToFolderSubCommand.execute();

        this.dualOutputModeToFolderSubCommand = new ReorderNodesCommand(
          verticalSelection,
          this.verticalFolderId,
          EPlaceType.Inside,
        );
        this.dualOutputModeToFolderSubCommand.execute();
      } else {
        // otherwise, just move the items
        this.moveToFolderSubCommand = new ReorderNodesCommand(
          this.items,
          folder.id,
          EPlaceType.Inside,
        );

        this.moveToFolderSubCommand.execute();
      }
    }
  }

  rollback() {
    // remove vertical folder node and node map entry
    if (this.dualOutputService.views.hasNodeMap(this.sceneId)) {
      this.scenesService.views.getScene(this.sceneId).removeFolder(this.verticalFolderId);
      if (this.dualOutputModeToFolderSubCommand) this.dualOutputModeToFolderSubCommand.rollback();

      this.sceneCollectionsService.removeVerticalNode(this.folderId, this.sceneId);
    }

    // rollback command
    if (this.moveToFolderSubCommand) this.moveToFolderSubCommand.rollback();

    // remove folder
    this.scenesService.views.getScene(this.sceneId).removeFolder(this.folderId);
  }
}
