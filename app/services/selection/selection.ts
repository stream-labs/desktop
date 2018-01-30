import { uniq } from 'lodash';
import { mutation, StatefulService } from 'services/stateful-service';
import {
  Scene,
  SceneItem,
  ScenesService,
  ISceneItem,
  ISceneItemActions
} from 'services/scenes';
import { Inject } from '../../util/injector';
import { shortcut } from '../shortcuts';

interface ISelectionServiceState {
  lastSelectedId: string;
  selectedIds: string[];

}

export class SelectionService extends StatefulService<ISelectionServiceState> implements ISceneItemActions {

  static initialState: ISelectionServiceState = {
    selectedIds: [],
    lastSelectedId: ''
  };

  @Inject()
  private scenesService: ScenesService;

  add(itemIds: string | string[]) {
    const ids: string[] = Array.isArray(itemIds) ? itemIds : [itemIds];
    this.set(this.getScene().activeItemIds.concat(ids));
    this.SET_LAST_SELECTED_ID(ids[ids.length - 1]);
  }

  set(itemIds: string | string[]) {
    let ids: string[] = Array.isArray(itemIds) ? itemIds : [itemIds];
    ids = uniq(ids);
    const scene = this.getScene();
    scene.makeItemsActive(ids);
    const activeObsIds = ids.map(id => scene.getItem(id).obsSceneItemId);

    scene.getObsScene().getItems().forEach(obsSceneItem => {
      if (activeObsIds.includes(obsSceneItem.id)) {
        obsSceneItem.selected = true;
      } else {
        obsSceneItem.selected = false;
      }
    });

    if (!scene.activeItemIds.includes(this.state.lastSelectedId)) {
      this.SET_LAST_SELECTED_ID(ids[ids.length - 1]);
    }
  }

  @shortcut('Ctrl+A')
  selectAll() {
    this.set(this.getScene().activeItemIds);
    return this;
  }

  reset() {
    this.set([]);
  }

  setVisibility(isVisible: boolean) {
    this.getItems().forEach(item => item.setVisibility(isVisible));
  }

  resetTransform() {
    this.getItems().forEach(item => item.resetTransform());
  }

  flipY() {
    this.getItems().forEach(item => item.flipY());
  }

  flipX() {
    this.getItems().forEach(item => item.flipX());
  }

  stretchToScreen() {
    this.getItems().forEach(item => item.stretchToScreen());
  }

  fitToScreen() {
    this.getItems().forEach(item => item.fitToScreen());
  }

  centerOnScreen() {
    this.getItems().forEach(item => item.centerOnScreen());
  }

  rotate(deg: number) {
    this.getItems().forEach(item => item.rotate(deg));
  }

  setLocked(isLocked: boolean) {
    this.getItems().forEach(item => item.setLocked(isLocked));
  }

  @shortcut('Delete')
  remove() {
    this.getItems().forEach(item => item.remove());
  }

  @shortcut('ArrowLeft')
  nudgeActiveItemsLeft() {
    this.getItems().forEach(item => item.nudgeLeft());
  }

  @shortcut('ArrowRight')
  nudgeActiveItemRight() {
    this.getItems().forEach(item => item.nudgeRight());
  }

  @shortcut('ArrowUp')
  nudgeActiveItemsUp() {
    this.getItems().forEach(item => item.nudgeUp());
  }

  @shortcut('ArrowDown')
  nudgeActiveItemsDown() {
    this.getItems().forEach(item => item.nudgeDown());
  }


  getItems(): SceneItem[] {
    return this.getScene().activeItems;
  }

  getIds(): string[] {
    return this.getScene().activeItemIds;
  }

  getInvertedIds(): string[] {
    const selectedIds = this.getIds();
    return this.getScene().getItemsIds().filter(id => {
      return !selectedIds.includes(id);
    });
  }

  getInverted(): SceneItem[] {
    const scene = this.getScene();
    return this.getInvertedIds()
      .map(id => scene.getItem(id))
      .filter(item => item.isVisualSource);
  }

  getLastSelected(): SceneItem {
    return this.getScene().getItem(this.state.lastSelectedId);
  }

  getSize(): number {
    return this.getScene().activeItemIds.length;
  }

  isSelected(item: string | ISceneItem) {
    const itemId = (typeof item === 'string') ?
      item :
      (item as ISceneItem).sceneItemId;
    return this.getIds().includes(itemId);
  }

  private getScene(): Scene {
    return this.scenesService.activeScene;
  }

  @mutation()
  private SET_LAST_SELECTED_ID(id: string) {
    this.state.lastSelectedId = id;
  }

  @mutation()
  private SET_SELECTED(ids: string[]) {
    this.state.selectedIds = ids;
  }

}

