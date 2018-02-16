import { uniq } from 'lodash';
import { mutation, StatefulService, ServiceHelper } from 'services/stateful-service';
import {
  Scene,
  SceneItem,
  ScenesService,
  ISceneItem,
  ISceneItemSettings,
  IPartialTransform
} from 'services/scenes';
import { Inject } from '../../util/injector';
import { shortcut } from '../shortcuts';
import { ISelection, ISelectionServiceApi, ISelectionState, TItemsList } from './selection-api';
import { Subject } from 'rxjs/Subject';
import Utils from '../utils';


/**
 * represents selection of active scene and provide shortcuts
 */
export class SelectionService
  extends StatefulService<ISelectionState>
  implements ISelectionServiceApi
{

  static initialState: ISelectionState = {
    selectedIds: [],
    lastSelectedId: ''
  };

  updated = new Subject<ISelectionState>();
  private sceneId: string;

  @Inject() private scenesService: ScenesService;

  init() {
    this.scenesService.sceneSwitched.subscribe(() => {
      this.reset();
    });
  }

  // SELECTION METHODS

  add: (items: TItemsList) => ISelection;
  deselect: (items: TItemsList) => ISelection;
  reset: () => ISelection;
  selectAll: () => ISelection;
  invert: () => ISelection;
  getItems: () => SceneItem[];
  getVisualItems: () => SceneItem[];
  getIds: () => string[];
  getInvertedIds: () => string[];
  getInverted: () => SceneItem[];
  getBoundingRect: () => IRectangle;
  getLastSelected: () => SceneItem;
  getSize: () => number;
  isSelected: (item: string | ISceneItem) => boolean;
  copyReferenceTo: (sceneId: string) => SceneItem[];
  copyTo: (sceneId: string) => SceneItem[];
  moveTo: (sceneId: string) => SceneItem[];


  // SCENE_ITEM METHODS

  setSettings: (settings: Partial<ISceneItemSettings>) => void;
  setVisibility: (isVisible: boolean) => void;
  setTransform: (transform: IPartialTransform) => void;
  resetTransform: () => void;
  flipY: () => void;
  flipX: () => void;
  stretchToScreen: () => void;
  fitToScreen: () => void;
  centerOnScreen: () => void;
  rotate: (deg: number) => void;
  setContentCrop: () => void;


  @shortcut('Delete')
  remove() {
    return this.getSelection().remove.call(this);
  }

  @shortcut('ArrowLeft')
  nudgeActiveItemsLeft() {
    return this.getSelection().nudgeActiveItemsLeft.call(this);
  }

  @shortcut('ArrowRight')
  nudgeActiveItemRight() {
    return this.getSelection().nudgeActiveItemRight.call(this);
  }

  @shortcut('ArrowUp')
  nudgeActiveItemsUp() {
    return this.getSelection().nudgeActiveItemsUp.call(this);
  }

  @shortcut('ArrowDown')
  nudgeActiveItemsDown() {
    return this.getSelection().nudgeActiveItemsDown.call(this);
  }

  /**
   * @override Selection.select
   */
  select(items: TItemsList): ISelection {
    this.getSelection().select.call(this, items);

    const scene = this.getScene();
    const activeObsIds = this.getItems()
      .map(sceneItem => sceneItem.obsSceneItemId);

    // tell OBS which sceneItems are selected
    scene.getObsScene().getItems().forEach(obsSceneItem => {
      if (activeObsIds.includes(obsSceneItem.id)) {
        obsSceneItem.selected = true;
      } else {
        obsSceneItem.selected = false;
      }
    });

    this.updated.next(this.state);
    return this;
  }


  /**
   * @override Selection.getScene
   */
  private getScene(): Scene {
    return this.scenesService.activeScene;
  }

  private getSelection(): Selection {
    return Selection.prototype;
  }

  /**
   * @override Selection.setState
   */
  private setState(state: Partial<ISelectionState>) {
    this.SET_STATE(state);
  }

  @mutation()
  private SET_STATE(state: Partial<ISelectionState>) {
    Object.assign(this.state, state);
  }
}

/**
 * Helper for working with multiple sceneItems
 */
@ServiceHelper()
export class Selection implements ISelection {

  @Inject() private scenesService: ScenesService;

  private state: ISelectionState = {
    selectedIds: [],
    lastSelectedId: ''
  };

  constructor(public sceneId: string, itemsIds: string[] = []) {
    this.select(itemsIds);
  }

  // SELECTION METHODS

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  add(itemsList: TItemsList): Selection {
    const ids = this.resolveItemsList(itemsList);
    this.select(this.state.selectedIds.concat(ids));
    return this;
  }

  select(itemsList: TItemsList): Selection {
    let ids = this.resolveItemsList(itemsList);
    ids = uniq(ids);
    const scene = this.getScene();
    const activeObsIds: number[] = [];

    // omit ids that are not presented on the scene
    ids = ids.filter(id => {
      const item = scene.getItem(id);
      if (!item) return false;
      activeObsIds.push(item.obsSceneItemId);
      return true;
    });

    this.setState({ selectedIds: ids });

    if (!this.state.selectedIds.includes(this.state.lastSelectedId)) {
      this.setState({ lastSelectedId: ids[ids.length - 1] });
    }

    return this;
  }

  deselect(itemsList: TItemsList): Selection {
    const ids = this.resolveItemsList(itemsList);
    this.select(this.state.selectedIds.filter(id => !ids.includes(id)));
    return this;
  }

  reset(): Selection {
    this.select([]);
    return this;
  }

  /**
   * return items with the order as in the scene
   */
  getItems(): SceneItem[] {
    const scene = this.getScene();
    if (!this.getSize()) return [];
    return scene.getItems().filter(item => this.state.selectedIds.includes(item.sceneItemId));
  }

  getVisualItems(): SceneItem[] {
    return this.getItems().filter(item => item.isVisualSource);
  }

  /**
   * the right order is not guaranteed
   */
  getIds(): string[] {
    return this.state.selectedIds;
  }

  getInvertedIds(): string[] {
    const selectedIds = this.getIds();
    return this.getScene().getItemIds().filter(id => {
      return !selectedIds.includes(id);
    });
  }

  getLastSelected(): SceneItem {
    return this.getScene().getItem(this.state.lastSelectedId);
  }

  getSize(): number {
    return this.state.selectedIds.length;
  }

  getBoundingRect(): IRectangle {
    const items = this.getVisualItems();
    if (!items.length) return null;

    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    items.forEach(item => {
      const rect = item.getRectangle();
      rect.normalize();
      minTop = Math.min(minTop, rect.y);
      minLeft = Math.min(minLeft, rect.x);
      maxRight = Math.max(maxRight, rect.x + rect.width);
      maxBottom = Math.max(maxBottom, rect.y + rect.height);
    });

    return {
      x: minLeft,
      y: minTop,
      width: maxRight - minLeft,
      height: maxBottom - minTop
    };
  }

  getInverted(): SceneItem[] {
    const scene = this.getScene();
    return this.getInvertedIds().map(id => scene.getItem(id));
  }

  invert(): Selection {
    const items = this.getInverted();
    this.select(items.map(item => item.sceneItemId));
    return this;
  }

  isSelected(item: string | ISceneItem) {
    const itemId = (typeof item === 'string') ?
      item :
      (item as ISceneItem).sceneItemId;
    return this.getIds().includes(itemId);
  }

  selectAll(): Selection {
    this.select(this.getScene().getItems().map(item => item.sceneItemId));
    return this;
  }

  copyReferenceTo(sceneId: string): SceneItem[] {
    const insertedItems: SceneItem[] = [];
    const scene = this.scenesService.getScene(sceneId);
    this.getItems().reverse().forEach(sceneItem => {
      const insertedItem = scene.addSource(sceneItem.sourceId);
      insertedItem.setSettings(sceneItem.getSettings());
      insertedItems.push(insertedItem);
    });
    return insertedItems;
  }

  copyTo(sceneId: string): SceneItem[] {
    const insertedItems: SceneItem[] = [];
    const scene = this.scenesService.getScene(sceneId);
    this.getItems().reverse().forEach(sceneItem => {
      const duplicatedSource = sceneItem.getSource().duplicate();

      if (!duplicatedSource) {
        alert(`Unable to duplicate ${sceneItem.name}`);
        return;
      }

      const insertedItem = scene.addSource(duplicatedSource.sourceId);
      insertedItem.setSettings(sceneItem.getSettings());
      insertedItems.push(insertedItem);
    });
    return insertedItems;
  }

  moveTo(sceneId: string): SceneItem[] {
    if (this.sceneId === sceneId) return;
    const insertedItems = this.copyReferenceTo(sceneId);
    this.remove();
    return insertedItems;
  }

  // SCENE_ITEM METHODS

  setSettings(settings: Partial<ISceneItemSettings>) {
    this.getItems().forEach(item => item.setSettings(settings));
  }

  setVisibility(isVisible: boolean) {
    this.getItems().forEach(item => item.setVisibility(isVisible));
  }

  setTransform(transform: IPartialTransform) {
    this.getItems().forEach(item => item.setTransform(transform));
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

  setContentCrop() {
    this.getItems().forEach(item => item.setContentCrop());
  }


  remove() {
    this.getItems().forEach(item => item.remove());
  }

  nudgeActiveItemsLeft() {
    this.getItems().forEach(item => item.nudgeLeft());
  }

  nudgeActiveItemRight() {
    this.getItems().forEach(item => item.nudgeRight());
  }

  nudgeActiveItemsUp() {
    this.getItems().forEach(item => item.nudgeUp());
  }

  nudgeActiveItemsDown() {
    this.getItems().forEach(item => item.nudgeDown());
  }

  getModel() {
    return { sceneId: this.sceneId, ...this.state };
  }

  /**
   * returns an array of sceneItem ids
   */
  private resolveItemsList(itemsList: TItemsList): string[] {
    if (Array.isArray(itemsList)) {

      if (!itemsList.length) {
        return [];
      }

      if (typeof itemsList[0] === 'string') {
        return itemsList as string[];
      }
      return (itemsList as ISceneItem[]).map(item => item.sceneItemId);

    }

    if (typeof itemsList === 'string') {
      return [itemsList];
    }

    return [itemsList.sceneItemId];
  }

  private setState(state: Partial<ISelectionState>) {
    Object.assign(this.state, state);
  }
}

// Apply a mixin to selection service to have a reactive state
Utils.applyMixins(SelectionService, [Selection]);
