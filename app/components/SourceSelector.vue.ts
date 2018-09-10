import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { SourcesService } from 'services/sources';
import { ScenesService, ISceneItemNode, TSceneNode } from 'services/scenes';
import { SelectionService } from 'services/selection/selection';
import { EditMenu } from '../util/menus/EditMenu';
import SlVueTree, {
  ISlTreeNode,
  ISlTreeNodeModel,
  ICursorPosition
} from 'sl-vue-tree';
import { $t } from 'services/i18n';

@Component({
  components: { SlVueTree }
})
export default class SourceSelector extends Vue {
  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private selectionService: SelectionService;

  sourcesTooltip = $t('scenes.sourcesTooltip');
  addSourceTooltip = $t('scenes.addSourceTooltip');
  removeSourcesTooltip = $t('scenes.removeSourcesTooltip');
  openSourcePropertiesTooltip = $t('scenes.openSourcePropertiesTooltip');
  addGroupTooltip = $t('scenes.addGroupTooltip');

  private expandedFoldersIds: string[] = [];

  $refs: {
    treeContainer: HTMLDivElement;
    slVueTree: SlVueTree<ISceneItemNode>;
  };

  get nodes(): ISlTreeNodeModel<ISceneItemNode>[] {
    // recursive function for transform SceneNode[] to ISlTreeNodeModel[]
    const getSlVueTreeNodes = (
      sceneNodes: TSceneNode[]
    ): ISlTreeNodeModel<ISceneItemNode>[] => {
      return sceneNodes.map(sceneNode => {
        return {
          title: sceneNode.name,
          isSelected: sceneNode.isSelected(),
          isLeaf: sceneNode.isItem(),
          isExpanded: this.expandedFoldersIds.indexOf(sceneNode.id) !== -1,
          data: sceneNode.getModel(),
          children: sceneNode.isFolder()
            ? getSlVueTreeNodes(sceneNode.getNodes())
            : null
        };
      });
    };

    return getSlVueTreeNodes(this.scene.getRootNodes());
  }

  addSource() {
    if (this.scenesService.activeScene) {
      this.sourcesService.showShowcase();
    }
  }

  addFolder() {
    if (this.scenesService.activeScene) {
      let itemsToGroup: string[] = [];
      let parentId: string;
      if (this.selectionService.canGroupIntoFolder()) {
        itemsToGroup = this.selectionService.getIds();
        const parent = this.selectionService.getClosestParent();
        if (parent) parentId = parent.id;
      }
      this.scenesService.showNameFolder({ itemsToGroup, parentId });
    }
  }

  showContextMenu(sceneNodeId?: string, event?: MouseEvent) {
    const sceneNode = this.scene.getNode(sceneNodeId);
    const menuOptions = sceneNode
      ? {
          selectedSceneId: this.scene.id,
          sceneNodeId,
          showSceneItemMenu: true
        }
      : { selectedSceneId: this.scene.id };

    const menu = new EditMenu(menuOptions);
    menu.popup();
    event && event.stopPropagation();
  }

  removeItems() {
    this.selectionService.remove();
  }

  sourceProperties() {
    if (!this.canShowProperties()) return;
    this.sourcesService.showSourceProperties(this.activeItems[0].sourceId);
  }

  canShowProperties(): boolean {
    if (this.activeItemIds.length === 0) return false;
    const sceneNode = this.selectionService.getLastSelected();
    return sceneNode && sceneNode.sceneNodeType === 'item'
      ? sceneNode.getSource().hasProps()
      : false;
  }

  handleSort(
    treeNodesToMove: ISlTreeNode<ISceneItemNode>[],
    position: ICursorPosition<TSceneNode>
  ) {
    const nodesToMove = this.scene.getSelection(
      treeNodesToMove.map(node => node.data.id)
    );

    const destNode = this.scene.getNode(position.node.data.id);

    if (position.placement === 'before') {
      nodesToMove.placeBefore(destNode.id);
    } else if (position.placement === 'after') {
      nodesToMove.placeAfter(destNode.id);
    } else if (position.placement === 'inside') {
      nodesToMove.setParent(destNode.id);
    }
    this.selectionService.select(nodesToMove.getIds());
  }

  makeActive(treeNodes: ISlTreeNode<ISceneItemNode>[], ev: MouseEvent) {
    const ids = treeNodes.map(treeNode => treeNode.data.id);
    this.selectionService.select(ids);
  }

  toggleFolder(treeNode: ISlTreeNode<ISceneItemNode>) {
    const nodeId = treeNode.data.id;
    if (treeNode.isExpanded) {
      this.expandedFoldersIds.splice(
        this.expandedFoldersIds.indexOf(nodeId),
        1
      );
    } else {
      this.expandedFoldersIds.push(nodeId);
    }
  }

  canShowActions(sceneNodeId: string) {
    const node = this.scene.getNode(sceneNodeId);
    return node.isItem() || node.getNestedItems().length;
  }

  get activeItemIds() {
    return this.selectionService.getIds();
  }

  get activeItems() {
    return this.selectionService.getItems();
  }

  toggleVisibility(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const visible = !selection.isVisible();
    selection.setSettings({ visible });
  }

  visibilityClassesForSource(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const visible = selection.isVisible();

    return {
      'icon-unhide': visible,
      'icon-hide': !visible
    };
  }

  lockClassesForSource(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const locked = selection.isLocked();

    return {
      'icon-lock': locked,
      'icon-unlock': !locked
    };
  }

  toggleLock(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const locked = !selection.isLocked();
    selection.setSettings({ locked });
  }

  get scene() {
    return this.scenesService.activeScene;
  }
}
