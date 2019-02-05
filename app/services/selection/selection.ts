import { uniq } from 'lodash';
import electron from 'electron';
import { mutation, ServiceHelper, StatefulService } from 'services/stateful-service';
import {
  IPartialTransform,
  ISceneItem,
  ISceneItemNode,
  ISceneItemSettings,
  Scene,
  SceneItem,
  SceneItemFolder,
  ScenesService,
  TSceneNode,
  TSceneNodeModel,
} from 'services/scenes';
import { $t } from 'services/i18n';
import { Inject } from '../../util/injector';
import { shortcut } from '../shortcuts';
import { ISelection, ISelectionServiceApi, ISelectionState, TNodesList } from './selection-api';
import { Subject } from 'rxjs';
import Utils from '../utils';
import { Source } from '../sources';
import { AnchorPoint, AnchorPositions, CenteringAxis } from 'util/ScalableRectangle';
import { Rect } from '../../util/rect';

/**
 * represents selection of active scene and provide shortcuts
 */
export class SelectionService extends StatefulService<ISelectionState>
  implements ISelectionServiceApi {
  static initialState: ISelectionState = {
    selectedIds: [],
    lastSelectedId: '',
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

  add: (items: TNodesList) => Selection;
  deselect: (items: TNodesList) => Selection;
  reset: () => Selection;
  selectAll: () => Selection;
  clone: () => Selection;
  invert: () => Selection;
  getItems: () => SceneItem[];
  getNodes: () => TSceneNode[];
  getFolders: () => SceneItemFolder[];
  getVisualItems: () => SceneItem[];
  getIds: () => string[];
  getInvertedIds: () => string[];
  getInverted: () => TSceneNode[];
  getBoundingRect: () => Rect;
  getLastSelected: () => SceneItem;
  getLastSelectedId: () => string;
  getSize: () => number;
  isSelected: (item: string | ISceneItem) => boolean;
  copyTo: (sceneId: string, folderId?: string, duplicateSources?: boolean) => TSceneNode[];
  moveTo: (sceneId: string, folderId?: string) => TSceneNode[];
  isSceneItem: () => boolean;
  isSceneFolder: () => boolean;
  canGroupIntoFolder: () => boolean;
  getClosestParent: () => SceneItemFolder;
  getRootNodes: () => TSceneNode[];
  getSources: () => Source[];

  // SCENE_ITEM METHODS

  setSettings: (settings: Partial<ISceneItemSettings>) => void;
  setVisibility: (isVisible: boolean) => void;
  setTransform: (transform: IPartialTransform) => void;
  resetTransform: () => void;
  scale: (scale: IVec2, origin?: IVec2) => void;
  scaleWithOffset: (scale: IVec2, offset: IVec2) => void;
  flipY: () => void;
  flipX: () => void;
  stretchToScreen: () => void;
  fitToScreen: () => void;
  centerOnScreen: () => void;
  centerOnHorizontal: () => void;
  centerOnVertical: () => void;
  rotate: (deg: number) => void;
  setContentCrop: () => void;

  // SCENE NODES METHODS
  placeAfter: (sceneNodeId: string) => void;
  placeBefore: (sceneNodeId: string) => void;
  setParent: (folderId: string) => void;

  @shortcut('Delete')
  remove() {
    const lastSelected = this.getLastSelected();

    if (!lastSelected) return;

    const name = lastSelected.name;
    const selectionLength = this.getSelection().getIds.call(this).length;
    const message =
      selectionLength > 1
        ? $t('Are you sure you want to remove these %{count} items?', { count: selectionLength })
        : $t('Are you sure you want to remove %{sceneName}?', { sceneName: name });

    electron.remote.dialog.showMessageBox(
      electron.remote.getCurrentWindow(),
      {
        message,
        type: 'warning',
        buttons: [$t('Cancel'), $t('OK')],
      },
      ok => {
        if (!ok) return;
        return this.getSelection().remove.call(this);
      },
    );
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
  select(items: TNodesList): ISelection {
    this.getSelection().select.call(this, items);

    const scene = this.getScene();
    const activeObsIds = this.getItems().map(sceneItem => sceneItem.obsSceneItemId);

    // tell OBS which sceneItems are selected
    scene
      .getObsScene()
      .getItems()
      .forEach(obsSceneItem => {
        obsSceneItem.selected = activeObsIds.includes(obsSceneItem.id);
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

  _resourceId: string;

  private state: ISelectionState = {
    selectedIds: [],
    lastSelectedId: '',
  };

  constructor(public sceneId: string, itemsList: TNodesList = []) {
    this.select(itemsList);
  }

  // SELECTION METHODS

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  add(itemsList: TNodesList): Selection {
    const ids = this.resolveItemsList(itemsList);
    this.select(this.state.selectedIds.concat(ids));
    return this;
  }

  select(itemsList: TNodesList): Selection {
    let ids = this.resolveItemsList(itemsList);
    ids = uniq(ids);
    const scene = this.getScene();

    // omit ids that are not presented on the scene
    // and select the all nested items of selected folders
    const selectedIds: string[] = [];
    ids.forEach(id => {
      const node = scene.getNode(id);
      if (!node) return;
      selectedIds.push(id);
      if (node.sceneNodeType !== 'folder') return;
      selectedIds.push(...(node as SceneItemFolder).getNestedNodesIds());
    });

    this.setState({ selectedIds });

    if (!this.state.selectedIds.includes(this.state.lastSelectedId)) {
      this.setState({ lastSelectedId: selectedIds[selectedIds.length - 1] });
    }

    this._resourceId = `Selection${JSON.stringify([this.sceneId, this.state.selectedIds])}`;

    return this;
  }

  deselect(itemsList: TNodesList): Selection {
    const ids = this.resolveItemsList(itemsList);
    this.select(this.state.selectedIds.filter(id => !ids.includes(id)));
    return this;
  }

  reset(): Selection {
    this.select([]);
    return this;
  }

  clone(): Selection {
    return this.getScene().getSelection(this.getIds());
  }

  /**
   * return items with the order as in the scene
   */
  getItems(): SceneItem[] {
    const scene = this.getScene();
    if (!this.getSize()) return [];
    return scene.getItems().filter(item => this.state.selectedIds.includes(item.id));
  }

  /**
   * return nodes with the order as in the scene
   */
  getNodes(): TSceneNode[] {
    const scene = this.getScene();
    if (!this.getSize()) return [];
    return scene.getNodes().filter(node => this.state.selectedIds.includes(node.id));
  }

  /**
   * return folders with the order as in the scene
   */
  getFolders(): SceneItemFolder[] {
    const scene = this.getScene();
    if (!this.getSize()) return [];
    return scene.getFolders().filter(folder => this.state.selectedIds.includes(folder.id));
  }

  /**
   * true if selections has only one SceneItem
   */
  isSceneItem(): boolean {
    return this.getSize() === 1 && this.getNodes()[0].isItem();
  }

  /**
   * true if selections has only one folder
   */
  isSceneFolder(): boolean {
    const folders = this.getFolders();
    if (folders.length !== 1) return false;
    const folder = folders[0];
    const isNotFolderChild = this.getItems().find(item => item.parentId !== folder.id);
    return !isNotFolderChild;
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
    return this.getScene()
      .getNodesIds()
      .filter(id => {
        return !selectedIds.includes(id);
      });
  }

  getLastSelected(): TSceneNode {
    return this.getScene().getNode(this.state.lastSelectedId);
  }

  getLastSelectedId(): string {
    return this.state.lastSelectedId;
  }

  getSize(): number {
    return this.state.selectedIds.length;
  }

  getBoundingRect(): Rect {
    const items = this.getVisualItems();
    if (!items.length) return null;

    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    items.forEach(item => {
      const rect = item.getBoundingRect();
      minTop = Math.min(minTop, rect.y);
      minLeft = Math.min(minLeft, rect.x);
      maxRight = Math.max(maxRight, rect.x + rect.width);
      maxBottom = Math.max(maxBottom, rect.y + rect.height);
    });

    return new Rect({
      x: minLeft,
      y: minTop,
      width: maxRight - minLeft,
      height: maxBottom - minTop,
    });
  }

  getInverted(): TSceneNode[] {
    const scene = this.getScene();
    return this.getInvertedIds().map(id => scene.getNode(id));
  }

  invert(): Selection {
    const items = this.getInverted();
    this.select(items.map(item => item.id));
    return this;
  }

  isSelected(sceneNode: string | TSceneNodeModel) {
    const itemId =
      typeof sceneNode === 'string' ? sceneNode : (sceneNode as ISceneItem).sceneItemId;
    return this.getIds().includes(itemId);
  }

  selectAll(): Selection {
    this.select(
      this.getScene()
        .getNodes()
        .map(node => node.id),
    );
    return this;
  }

  copyTo(sceneId: string, folderId?: string, duplicateSources = false): TSceneNode[] {
    const insertedNodes: TSceneNode[] = [];
    const scene = this.scenesService.getScene(sceneId);
    const foldersMap: Dictionary<string> = {};
    let prevInsertedNode: TSceneNode;
    let insertedNode: TSceneNode;

    const sourcesMap: Dictionary<Source> = {};
    // TODO: we're updating this, but we don't seem to ever use it
    const notDuplicatedSources: Source[] = [];
    if (duplicateSources) {
      this.getSources().forEach(source => {
        const duplicatedSource = source.duplicate();
        if (!duplicatedSource) {
          notDuplicatedSources.push(source);
          return;
        }
        sourcesMap[source.sourceId] = duplicatedSource;
      });
    }

    // copy items and folders structure
    this.getNodes().forEach(sceneNode => {
      if (sceneNode.isFolder()) {
        insertedNode = scene.createFolder(sceneNode.name);
        foldersMap[sceneNode.id] = insertedNode.id;
        insertedNodes.push(insertedNode);
      } else if (sceneNode.isItem()) {
        insertedNode = scene.addSource(
          sourcesMap[sceneNode.sourceId]
            ? sourcesMap[sceneNode.sourceId].sourceId
            : sceneNode.sourceId,
        );
        insertedNode.setSettings(sceneNode.getSettings());
        insertedNodes.push(insertedNode);
      }

      const newParentId = foldersMap[sceneNode.parentId] || '';
      if (newParentId) {
        insertedNode.setParent(newParentId);
      }

      if (prevInsertedNode && prevInsertedNode.parentId === newParentId) {
        insertedNode.placeAfter(prevInsertedNode.id);
      }

      prevInsertedNode = insertedNode;
    });

    return insertedNodes;
  }

  moveTo(sceneId: string, folderId?: string): TSceneNode[] {
    if (this.sceneId === sceneId) {
      if (!folderId) return;
      this.getRootNodes()
        .reverse()
        .forEach(sceneNode => sceneNode.setParent(folderId));
    } else {
      const insertedItems = this.copyTo(sceneId, folderId);
      this.remove();
      return insertedItems;
    }
  }

  isVisible() {
    return !this.getItems().find(item => !item.visible);
  }

  isLocked() {
    return !this.getItems().find(item => !item.locked);
  }

  /**
   * Returns a minimal representation of selection
   * for selection list like this:
   *
   * Folder1      <- selected
   *  |_ Item1    <- selected
   *  \_ Folder2  <- selected
   * Item3        <- selected
   * Folder3
   *  |_ Item3
   *  \_ Item4    <- selected
   *
   *  returns Folder1, Item3, Item4
   */
  getRootNodes(): TSceneNode[] {
    const rootNodes: TSceneNode[] = [];
    const foldersIds: string[] = [];
    this.getNodes().forEach(node => {
      if (!foldersIds.includes(node.parentId)) {
        rootNodes.push(node);
      }
      if (node.isFolder()) foldersIds.push(node.id);
    });
    return rootNodes;
  }

  /**
   * Returns the closest common parent folder for selection if exists
   */
  getClosestParent(): SceneItemFolder {
    const rootNodes = this.getRootNodes();
    const paths: string[][] = [];

    for (const node of rootNodes) {
      if (!node.parentId) return null;
      paths.push(node.getPath());
    }

    const minPathLength = Math.min(...paths.map(path => path.length));
    let closestParentId = '';

    for (let ind = 0; ind < minPathLength; ind++) {
      const parents = paths.map(path => path[ind]);
      if (uniq(parents).length === 1) {
        closestParentId = parents[0];
      } else {
        return this.getScene().getFolder(closestParentId);
      }
    }
  }

  canGroupIntoFolder(): boolean {
    const selectedNodes = this.getRootNodes();
    const nodesFolders = selectedNodes.map(node => node.parentId || null);
    const nodesHaveTheSameParent = uniq(nodesFolders).length === 1;
    return selectedNodes.length > 1 && nodesHaveTheSameParent;
  }

  getSources(): Source[] {
    // TODO: we're never updating sourceIds, the condition below will always fail
    const sourcesIds: string[] = [];
    const sources: Source[] = [];
    this.getItems().forEach(item => {
      const source = item.getSource();
      if (sourcesIds.includes(source.sourceId)) return;
      sources.push(source);
    });
    return sources;
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

  /**
   * Scale items.
   * Origin is the center point of scaling relative to the bounding-box of the selection
   * Where origin = [0, 0] - is top-left corner and [1, 1] is the bottom right corner of the selection
   */
  scale(scale: IVec2, origin: IVec2 = AnchorPositions[AnchorPoint.Center]) {
    const originPos = this.getBoundingRect().getOffsetFromOrigin(origin);
    this.getItems().forEach(item => item.scaleWithOffset(scale, originPos));
  }

  /**
   * same as .scale() but use absolute `offset` point instead of a relative `origin` point
   */
  scaleWithOffset(scale: IVec2, offset: IVec2) {
    this.scale(scale, this.getBoundingRect().getOriginFromOffset(offset));
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

  centerOnHorizontal() {
    this.getItems().forEach(item => item.centerOnAxis(CenteringAxis.X));
  }

  centerOnVertical() {
    this.getItems().forEach(item => item.centerOnAxis(CenteringAxis.Y));
  }

  rotate(deg: number) {
    this.getItems().forEach(item => item.rotate(deg));
  }

  setContentCrop() {
    this.getItems().forEach(item => item.setContentCrop());
  }

  remove() {
    this.getNodes().forEach(node => node.remove());
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

  placeAfter(sceneNodeId: string) {
    this.getRootNodes()
      .reverse()
      .forEach(node => node.placeAfter(sceneNodeId));
  }

  placeBefore(sceneNodeId: string) {
    this.getRootNodes().forEach(node => node.placeBefore(sceneNodeId));
  }

  setParent(sceneNodeId: string) {
    this.getRootNodes()
      .reverse()
      .forEach(node => node.setParent(sceneNodeId));
  }

  /**
   * returns an array of sceneItem ids
   */
  private resolveItemsList(itemsList: TNodesList): string[] {
    if (!itemsList) return [];

    if (Array.isArray(itemsList)) {
      if (!itemsList.length) {
        return [];
      }

      if (typeof itemsList[0] === 'string') {
        return itemsList as string[];
      }
      return (itemsList as ISceneItemNode[]).map(item => item.id);
    }

    if (typeof itemsList === 'string') {
      return [itemsList];
    }

    return [itemsList.id];
  }

  private setState(state: Partial<ISelectionState>) {
    Object.assign(this.state, state);
  }
}

// Apply a mixin to selection service to have a reactive state
Utils.applyMixins(SelectionService, [Selection]);
