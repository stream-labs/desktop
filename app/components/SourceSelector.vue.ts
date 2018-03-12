import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import Selector from './Selector.vue';
import { SourcesService } from 'services/sources';
import { ScenesService, SceneItem } from 'services/scenes';
import { SelectionService } from 'services/selection/selection';
import { EditMenu } from '../util/menus/EditMenu';

@Component({
  components: { Selector }
})
export default class SourceSelector extends Vue {

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private selectionService: SelectionService;

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

  handleSort(data: any) {
    const rootNodes = this.scene.getRootNodes();
    const nodeToMove = rootNodes[data.change.moved.oldIndex];
    const destNode = this.scene.getRootNodes()[data.change.moved.newIndex];

    if (destNode.getNodeIndex() < nodeToMove.getNodeIndex()) {
      nodeToMove.placeBefore(destNode.id);
    } else {
      nodeToMove.placeAfter(destNode.id);
    }
  }

  makeActive(sceneItemId: string, ev: MouseEvent) {
    if (ev.ctrlKey) {
      if (this.selectionService.isSelected(sceneItemId) && ev.button !== 2) {
        this.selectionService.deselect(sceneItemId);
      } else {
        this.selectionService.add(sceneItemId);
      }
    } else if (!(ev.button === 2 && this.selectionService.isSelected(sceneItemId))) {
      this.selectionService.select(sceneItemId);
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

  get scene() {
    return this.scenesService.activeScene;
  }

  get sources() {
    return this.scene.getRootNodes().map(sceneNode => {
      return {
        name: sceneNode.name,
        value: sceneNode.id
      };
    });
  }

}
