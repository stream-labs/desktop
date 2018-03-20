import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { SourcesService } from 'services/sources';
import { ScenesService, ISceneItemNode, TSceneNode } from 'services/scenes';
import { SelectionService } from 'services/selection/selection';
import { EditMenu } from '../util/menus/EditMenu';
import SlVueTree, { ISlTreeNode, ISlTreeNodeModel, ICursorPosition } from 'sl-vue-tree';

@Component({
  components: { SlVueTree }
})
export default class SourceSelector extends Vue {

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private selectionService: SelectionService;

  private expandedFoldersIds: string[] = [];
  private scrollIntervalId: number = null;

  $refs: {
    treeContainer: HTMLDivElement;
    slVueTree: SlVueTree<ISceneItemNode>;
  };

  get nodes(): ISlTreeNodeModel<ISceneItemNode>[] {

    // recursive function for transform SceneNode[] to ISlTreeNodeModel[]
    const getSlVueTreeNodes = ((sceneNodes: TSceneNode[]): ISlTreeNodeModel<ISceneItemNode>[] => {
      return sceneNodes.map(sceneNode => {
        return {
          title: sceneNode.name,
          isSelected: sceneNode.isSelected(),
          isLeaf: sceneNode.isItem(),
          isExpanded: this.expandedFoldersIds.indexOf(sceneNode.id) !== -1,
          data: sceneNode.getModel(),
          children: sceneNode.isFolder() ? getSlVueTreeNodes(sceneNode.getNodes()) : null
        };
      });
    });

    return getSlVueTreeNodes(this.scene.getRootNodes());
  }


  addSource() {
    if (this.scenesService.activeScene) {
      this.sourcesService.showShowcase();
    }
  }

  showContextMenu(sceneNodeId?: string) {
    const sceneNode = this.scene.getNode(sceneNodeId);
    const menuOptions = sceneNode ?
      ({
        selectedSceneId: this.scene.id,
        showSceneItemMenu: true
      }) :
      ({ selectedSceneId: this.scene.id });

    const menu = new EditMenu(menuOptions);
    menu.popup();
    menu.destroy();
  }

  removeItems() {
    // We can only remove a source if at least one is selected
    if (this.activeItemIds.length > 0) {
      this.activeItemIds.forEach(itemId => this.scene.removeItem(itemId));
    }
  }

  sourceProperties() {
    if (!this.canShowProperties()) return;
    this.sourcesService.showSourceProperties(this.activeItems[0].sourceId);
  }

  canShowProperties(): boolean {
    if (this.activeItemIds.length === 0) return false;
    const sceneNode = this.selectionService.getLastSelected();
    return (sceneNode && sceneNode.sceneNodeType === 'item') ?
      sceneNode.getSource().hasProps() :
      false;
  }

  handleSort(treeNodeToMove: ISlTreeNode<ISceneItemNode>, position: ICursorPosition<TSceneNode>) {
    const nodeToMove = this.scene.getNode(treeNodeToMove.data.id);
    const destNode = this.scene.getNode(position.node.data.id);

    if (position.placement === 'before') {
      nodeToMove.placeBefore(destNode.id);
    } else if (position.placement === 'after') {
      nodeToMove.placeAfter(destNode.id);
    } else if (position.placement === 'inside') {
      nodeToMove.setParent(destNode.id);
    }
    nodeToMove.select();
  }

  startScroll(direction: 'top' | 'bottom') {
    // const slVueTree = this.$refs.slVueTree;
    // const treeContaier = this.$refs.treeContainer;
    // this.scrollIntervalId = window.setInterval(() => {
    //   if (!slVueTree.draggingNode) {
    //     this.stopScroll();
    //     return;
    //   }
    //   const deltaScroll = direction === 'top' ? -2 : +2;
    //   treeContaier.scrollTop += deltaScroll;
    // }, 500);
  }

  stopScroll() {
    clearInterval(this.scrollIntervalId);
  }

  makeActive(treeNode: ISlTreeNode<ISceneItemNode>, ev: MouseEvent) {
    const sceneNode = this.scene.getNode(treeNode.data.id);
    if (ev.ctrlKey) {
      if (sceneNode.isSelected() && ev.button !== 2) {
        sceneNode.deselect();
      } else {
        sceneNode.addToSelection();
      }
    } else if (!(ev.button === 2 && sceneNode.isSelected())) {
      sceneNode.select();
    }
  }

  toggleFolder(treeNode: ISlTreeNode<ISceneItemNode>) {
    const nodeId = treeNode.data.id;
    if (treeNode.isExpanded) {
      this.expandedFoldersIds.splice(this.expandedFoldersIds.indexOf(nodeId), 1);
    } else {
      this.expandedFoldersIds.push(nodeId);
    }
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
      'fa-eye': visible,
      'fa-eye-slash': !visible
    };
  }

  lockClassesForSource(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const locked = selection.isLocked();

    return {
      'fa-lock': locked,
      'fa-unlock': !locked
    };
  }

  toggleLock(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const locked = !selection.isLocked();
    selection.setSettings({ locked });
  }


  handleDragleave(node: ISlTreeNode<ISceneItemNode>, direction: 'top' | 'bottom', event: MouseEvent) {
    const slVueTree = this.$refs.slVueTree;
    if (!slVueTree.draggingNode) return;

    this.startScroll(direction);
  }

  get scene() {
    return this.scenesService.activeScene;
  }

}
