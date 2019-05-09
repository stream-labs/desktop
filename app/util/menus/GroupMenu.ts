import { Menu } from './Menu';
import { ScenesService } from 'services/scenes';
import { SelectionService } from 'services/selection';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';

export class GroupMenu extends Menu {
  @Inject() private scenesService: ScenesService;
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  constructor() {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    const selectionSize = this.selectionService.getSize();
    const selectedItem = this.selectionService.getItems()[0];
    const selectedNodes = this.selectionService.getNodes();
    const nodesFolders = selectedNodes.map(node => node.parentId || null);

    this.append({
      label: $t('Group into Folder'),
      click: () => {
        this.scenesService.showNameFolder({
          sceneId: this.scenesService.activeSceneId,
          itemsToGroup: this.selectionService.getIds(),
          parentId: nodesFolders[0],
        });
      },
      enabled: this.selectionService.canGroupIntoFolder(),
    });

    this.append({
      label: $t('Ungroup Folder'),
      click: () => {
        this.editorCommandsService.executeCommand(
          'RemoveFolderCommand',
          this.scenesService.activeSceneId,
          this.selectionService.getFolders()[0].id,
        );
      },
      enabled: this.selectionService.isSceneFolder(),
    });

    this.append({
      label: $t('Group into Scene'),
      click: () => {
        this.scenesService.showNameScene({
          itemsToGroup: this.selectionService.getIds(),
        });
      },
      enabled: selectionSize > 1,
    });

    this.append({
      label: $t('Ungroup Scene'),
      click: () => {
        const scene = this.scenesService.getScene(selectedItem.getSource().sourceId);
        scene
          .getSelection()
          .selectAll()
          .copyTo(this.scenesService.activeSceneId);
        selectedItem.remove();
        scene.remove();
      },
      enabled: (() => {
        return !!(selectionSize === 1 && selectedItem && selectedItem.getSource().type === 'scene');
      })(),
    });
  }
}
