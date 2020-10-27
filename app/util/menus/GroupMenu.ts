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
    const selectionSize = this.selectionService.views.globalSelection.getSize();
    const selectedItem = this.selectionService.views.globalSelection.getItems()[0];
    const selectedNodes = this.selectionService.views.globalSelection.getNodes();
    const nodesFolders = selectedNodes.map(node => node.parentId || null);

    this.append({
      label: $t('Group into Folder'),
      click: () => {
        this.scenesService.showNameFolder({
          sceneId: this.scenesService.views.activeSceneId,
          itemsToGroup: this.selectionService.views.globalSelection.getIds(),
          parentId: nodesFolders[0],
        });
      },
      enabled: this.selectionService.views.globalSelection.canGroupIntoFolder(),
    });

    this.append({
      label: $t('Ungroup Folder'),
      click: () => {
        this.editorCommandsService.executeCommand(
          'RemoveFolderCommand',
          this.scenesService.views.activeSceneId,
          this.selectionService.views.globalSelection.getFolders()[0].id,
        );
      },
      enabled: this.selectionService.views.globalSelection.isSceneFolder(),
    });

    this.append({
      label: $t('Group into Scene'),
      click: () => {
        this.scenesService.showNameScene({
          itemsToGroup: this.selectionService.views.globalSelection.getIds(),
        });
      },
      enabled: selectionSize > 1,
    });

    this.append({
      label: $t('Ungroup Scene'),
      click: () => {
        this.editorCommandsService.executeCommand(
          'UngroupSceneCommand',
          selectedItem.id,
          this.scenesService.views.activeSceneId,
        );
      },
      enabled: (() => {
        return !!(selectionSize === 1 && selectedItem && selectedItem.getSource().type === 'scene');
      })(),
    });
  }
}
