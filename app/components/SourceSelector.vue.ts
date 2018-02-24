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

  showContextMenu(sceneItemId?: string) {
    const sceneItem = this.scene.getItem(sceneItemId);
    const menuOptions = sceneItem ?
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
    return this.activeItems[0].getSource().hasProps();
  }

  handleSort(data: any) {
    const positionDelta = data.change.moved.newIndex - data.change.moved.oldIndex;

    this.scenesService.activeScene.setSourceOrder(
      data.change.moved.element.value,
      positionDelta,
      data.order
    );
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

  toggleVisibility(sceneItemId: string) {
    const source = this.scene.getItem(sceneItemId);

    source.setVisibility(!source.visible);
  }

  visibilityClassesForSource(sceneItemId: string) {
    const visible = this.scene.getItem(sceneItemId).visible;

    return {
      'fa-eye': visible,
      'fa-eye-slash': !visible
    };
  }

  lockClassesForSource(sceneItemId: string) {
    const locked = this.scene.getItem(sceneItemId).locked;

    return {
      'fa-lock': locked,
      'fa-unlock': !locked
    };
  }

  toggleLock(sceneItemId: string) {
    const item = this.scene.getItem(sceneItemId);
    item.setSettings({ locked: !item.locked });
  }

  get scene() {
    return this.scenesService.activeScene;
  }

  get sources() {
    return this.scene.getItems().map((sceneItem: SceneItem) => {
      return {
        name: sceneItem.name,
        value: sceneItem.sceneItemId
      };
    });
  }

}
