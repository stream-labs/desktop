import { uniq } from 'lodash';
import { mutation, StatefulService, ServiceHelper } from 'services/stateful-service';
import {
  Scene,
  SceneItem,
  ScenesService,
  ISceneItem,
  ISceneItemSettings,
  IPartialTransform,
  ISceneItemActions
} from 'services/scenes';
import { Inject } from '../../util/injector';
import { shortcut } from '../shortcuts';
import { ISelectionServiceApi } from './selection-api';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
interface ISelectionServiceState {
  lastSelectedId: string;
  selectedIds: string[];

}

/**
 * represents selection of active scene and provide shortcuts
 */
export class SelectionService
  extends StatefulService<ISelectionServiceState>
  implements ISelectionServiceApi
{

  static initialState: ISelectionServiceState = {
    selectedIds: [],
    lastSelectedId: ''
  };

  updated = new Subject<ISelectionServiceState>();

  @Inject() private scenesService: ScenesService;
  private selection: Selection;
  private selectionSubscription: Subscription;

  init() {
    this.setSelection(this.getScene().getSelection());
    this.scenesService.sceneSwitched.subscribe(() => {
      this.setSelection(this.getScene().getSelection());
    });
  }

  // SELECTION METHODS

  add(itemIds: string | string[]) {
    return this.selection.add(itemIds);
  }

  select(itemIds: string | string[]) {
    return this.selection.select(itemIds);
  }

  deselect(itemIds: string | string[]) {
    return this.selection.deselect(itemIds);
  }

  reset() {
    return this.selection.reset();
  }

  getItems(): SceneItem[] {
    return this.selection.getItems();
  }

  getIds(): string[] {
    return this.selection.getIds();
  }

  getInvertedIds(): string[] {
    return this.selection.getInvertedIds();
  }

  getInverted(): SceneItem[] {
    return this.selection.getInverted();
  }

  invert(): SceneItem[] {
    return this.selection.invert();
  }

  getLastSelected(): SceneItem {
    return this.selection.getLastSelected();
  }

  getSize(): number {
    return this.selection.getSize();
  }

  isSelected(item: string | ISceneItem) {
    return this.selection.isSelected(item);
  }

  selectAll() {
    return this.selection.selectAll();
  }


  // SCENE_ITEM METHODS

  setSettings(settings: Partial<ISceneItemSettings>) {
    return this.selection.setSettings(settings);
  }

  setVisibility(isVisible: boolean) {
    return this.selection.setVisibility(isVisible);
  }

  setTransform(transform: IPartialTransform) {
    return this.selection.setTransform(transform);
  }

  resetTransform() {
    return this.selection.resetTransform();
  }

  flipY() {
    return this.selection.flipY();
  }

  flipX() {
    return this.selection.flipX();
  }

  stretchToScreen() {
    return this.selection.stretchToScreen();
  }

  fitToScreen() {
    return this.selection.fitToScreen();
  }

  centerOnScreen() {
    return this.selection.centerOnScreen();
  }

  rotate(deg: number) {
    return this.selection.rotate(deg);
  }

  @shortcut('Delete')
  remove() {
    return this.selection.remove();
  }

  @shortcut('ArrowLeft')
  nudgeActiveItemsLeft() {
    return this.selection.nudgeActiveItemsLeft();
  }

  @shortcut('ArrowRight')
  nudgeActiveItemRight() {
    return this.selection.nudgeActiveItemRight();
  }

  @shortcut('ArrowUp')
  nudgeActiveItemsUp() {
    return this.selection.nudgeActiveItemsUp();
  }

  @shortcut('ArrowDown')
  nudgeActiveItemsDown() {
    return this.selection.nudgeActiveItemsDown();
  }

  private getScene(): Scene {
    return this.scenesService.activeScene;
  }

  private setSelection(selection: Selection) {
    if (this.selection) {
      this.selectionSubscription.unsubscribe();
    }

    this.selectionSubscription = selection.updated.subscribe(state => {

      const scene = this.getScene();
      const activeObsIds = this.selection
        .getItems()
        .map(sceneItem => sceneItem.obsSceneItemId);

      // tell OBS which sceneItems are selected
      scene.getObsScene().getItems().forEach(obsSceneItem => {
        if (activeObsIds.includes(obsSceneItem.id)) {
          obsSceneItem.selected = true;
        } else {
          obsSceneItem.selected = false;
        }
      });

      this.SET_SELECTED(state.selectedIds);
      this.SET_LAST_SELECTED_ID(state.lastSelectedId);

      this.updated.next(this.state);
    });

    this.selection = selection;
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

/**
 * Helper for working with multiple sceneItems
 */
@ServiceHelper()
export class Selection  {

  updated = new Subject<{selectedIds: string[], lastSelectedId: string}>();

  @Inject() private scenesService: ScenesService;

  private selectedIds: string[] = [];
  private lastSelectedId: string;

  constructor(public sceneId: string, itemsIds: string[] = []) {
    this.select(itemsIds);
  }

  // SELECTION METHODS

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  add(itemIds: string | string[]) {
    const ids: string[] = Array.isArray(itemIds) ? itemIds : [itemIds];
    this.select(this.selectedIds.concat(ids));
  }

  select(itemIds: string | string[]) {
    let ids: string[] = Array.isArray(itemIds) ? itemIds : [itemIds];
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

    this.selectedIds = ids;

    if (!this.selectedIds.includes(this.lastSelectedId)) {
      this.lastSelectedId = ids[ids.length - 1];
    }

    this.updated.next({
      selectedIds: this.selectedIds,
      lastSelectedId: this.lastSelectedId
    });
  }

  deselect(itemIds: string | string[]) {
    const ids: string[] = Array.isArray(itemIds) ? itemIds : [itemIds];
    this.select(this.selectedIds.filter(id => !ids.includes(id)));
  }

  reset() {
    this.select([]);
  }

  getItems(): SceneItem[] {
    const scene = this.getScene();
    return this.getIds().map(id => scene.getItem(id));
  }

  getIds(): string[] {
    return this.selectedIds;
  }

  getInvertedIds(): string[] {
    const selectedIds = this.getIds();
    return this.getScene().getItemIds().filter(id => {
      return !selectedIds.includes(id);
    });
  }

  getInverted(): SceneItem[] {
    const scene = this.getScene();
    return this.getInvertedIds().map(id => scene.getItem(id));
  }

  invert(): SceneItem[] {
    const items = this.getInverted();
    this.select(items.map(item => item.sceneItemId));
    return items;
  }

  getLastSelected(): SceneItem {
    return this.getScene().getItem(this.lastSelectedId);
  }

  getSize(): number {
    return this.selectedIds.length;
  }

  isSelected(item: string | ISceneItem) {
    const itemId = (typeof item === 'string') ?
      item :
      (item as ISceneItem).sceneItemId;
    return this.getIds().includes(itemId);
  }

  selectAll() {
    this.select(this.getScene().getItems().map(item => item.sceneItemId));
  }

  groupIntoScene(newSceneName: string): Scene {
    if (!this.getSize()) return null;
    const scene = this.scenesService.createScene(newSceneName);

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
}

