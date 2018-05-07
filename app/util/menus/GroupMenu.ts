import { uniq } from 'lodash';
import { Menu } from './Menu';
import { ScenesService } from 'services/scenes';
import { SelectionService } from 'services/selection';
import { Inject } from '../../util/injector';

export class GroupMenu extends Menu {

  @Inject() private scenesService: ScenesService;
  @Inject() private selectionService: SelectionService;

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
      label: 'Group into Folder',
      click: () => {
        this.scenesService.showNameFolder({
          itemsToGroup: this.selectionService.getIds(),
          parentId: nodesFolders[0]
        });
      },
      enabled: this.selectionService.canGroupIntoFolder()
    });

    this.append({
      label: 'Ungroup Folder',
      click: () => {
        this.selectionService.getFolders()[0].ungroup();
      },
      enabled: this.selectionService.isSceneFolder()
    });


    this.append({
      label: 'Group into Scene',
      click: () => {
        this.scenesService.showNameScene({
          itemsToGroup: this.selectionService.getIds()
        });
      },
      enabled: selectionSize > 1
    });

    this.append({
      label: 'Ungroup Scene',
      click: () => {
        const scene = this.scenesService.getScene(
          selectedItem.getSource().sourceId
        );
        scene.getSelection()
          .selectAll()
          .copyTo(this.scenesService.activeSceneId);
        selectedItem.remove();
        scene.remove();
      }
      ,
      enabled: (() => {
        return !!(selectionSize === 1 && selectedItem && selectedItem.getSource().type === 'scene');
      })()
    });


  }

}
