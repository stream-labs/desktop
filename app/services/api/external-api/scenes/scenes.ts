import { Observable } from 'rxjs';
import { TSourceType } from 'services/sources/index';
import { InjectFromExternalApi, Singleton } from '../../external-api';
import { ServiceHelper } from 'services/stateful-service';
import {
  ScenesService as InternalScenesService,
  SceneItemNode as InternalSceneNode,
  SceneItem as InternalSceneItem,
  SceneItemFolder as InternalSceneItemFolder,
  Scene as InternalScene,
  ISceneItemActions,
} from 'services/scenes/index';
import { Source, SourcesService, ISourceModel, ISourceAddOptions } from '../sources/sources';
import { Selection } from './selection';
import { Inject } from '../../../../util/injector';

/**
 * Api for scenes management
 */
@Singleton()
export class ScenesService {
  @Inject() private scenesService: InternalScenesService;

  getScene(id: string): Scene {
    return new Scene(id);
  }

  getScenes(): Scene[] {
    return this.scenesService.getScenes().map(scene => this.getScene(scene.id));
  }

  createScene(name: string): Scene {
    const scene = this.scenesService.createScene(name);
    return this.getScene(scene.id);
  }

  removeScene(id: string): IScene {
    const model = this.getScene(id).getModel();
    this.scenesService.removeScene(id);
    return model;
  }

  makeSceneActive(id: string): void {
    this.scenesService.makeSceneActive(id);
  }

  get activeScene(): Scene {
    return this.getScene(this.activeSceneId);
  }

  get activeSceneId(): string {
    return this.scenesService.activeSceneId;
  }

  get sceneSwitched(): Observable<IScene> {
    return this.scenesService.sceneSwitched;
  }

  get sceneAdded(): Observable<IScene> {
    return this.scenesService.sceneAdded;
  }

  get sceneRemoved(): Observable<IScene> {
    return this.scenesService.sceneRemoved;
  }

  get itemAdded(): Observable<ISceneItem> {
    return this.scenesService.itemAdded;
  }

  get itemRemoved(): Observable<ISceneItem> {
    return this.scenesService.itemAdded;
  }

  get itemUpdated(): Observable<ISceneItem> {
    return this.scenesService.itemAdded;
  }
}

export interface ISceneNode {
  id: string;
  sceneId: string;
  sceneNodeType: TSceneNodeType;
  parentId?: string;
  childrenIds?: string[];
}

export interface ISceneItem extends ISceneItemSettings, ISceneNode {
  sceneItemId: string;
  sourceId: string;
}

export interface ISceneItemFolder extends ISceneNode {
  name: string;
}

export type TSceneNode = ISceneItem | ISceneItemFolder;

export interface IScene {
  id: string;
  name: string;
  nodes: ISceneNode[];
}

export type TSceneNodeType = 'item' | 'folder';

interface SceneItemNodeModel {
  id: string;
  sceneId: string;
  sceneNodeType: TSceneNodeType;
  parentId?: string;
  childrenIds?: string[];
}

@ServiceHelper()
export class Scene {
  @InjectFromExternalApi() private scenesService: ScenesService;
  @InjectFromExternalApi() private sourcesService: SourcesService;
  @Inject('ScenesService') private internalScenesService: InternalScenesService;

  private scene: InternalScene;

  constructor(private sceneId: string) {
    this.scene = this.internalScenesService.getScene(sceneId);
  }

  getModel(): IScene {
    return {
      id: this.scene.id,
      name: this.scene.name,
      nodes: this.getNodes().map(node => node.getModel()),
    };
  }

  getNode(sceneNodeId: string): SceneNode {
    const node = this.scene.getNode(sceneNodeId);
    return node.sceneNodeType === 'folder'
      ? this.getFolder(sceneNodeId)
      : this.getItem(sceneNodeId);
  }

  getNodeByName(name: string): SceneNode {
    const node = this.scene.getNodeByName(name);
    return node ? this.getNode(node.id) : null;
  }

  getItem(sceneItemId: string): SceneItem {
    const folder = this.scene.getItem(sceneItemId);
    if (!folder) return null;
    return folder ? new SceneItem(folder.sceneId, folder.id) : null;
  }

  getFolder(sceneFolderId: string): SceneItemFolder {
    const folder = this.scene.getFolder(sceneFolderId);
    if (!folder) return null;
    return folder ? new SceneItemFolder(folder.sceneId, folder.id) : null;
  }

  getNodes(): SceneNode[] {
    return this.scene.getNodes().map(node => this.getNode(node.id));
  }

  getRootNodes(): SceneNode[] {
    return this.scene.getRootNodes().map(node => this.getNode(node.sceneId));
  }

  getItems(): SceneItem[] {
    return this.scene.getItems().map(item => this.getItem(item.id));
  }

  getFolders(): SceneItemFolder[] {
    return this.scene.getFolders().map(folder => this.getFolder(folder.id));
  }

  /**
   * returns scene items of scene + scene items of nested scenes
   */
  getNestedItems(): SceneItem[] {
    return this.scene.getNestedItems().map(item => this.getItem(item.id));
  }

  /**
   * returns sources of scene + sources of nested scenes
   * result also includes nested scenes
   */
  getNestedSources(): Source[] {
    return this.scene
      .getNestedSources()
      .map(source => this.sourcesService.getSource(source.sourceId));
  }

  /**
   * return nested scenes in the safe-to-add order
   */
  getNestedScenes(): Scene[] {
    return this.scene.getNestedScenes().map(scene => this.scenesService.getScene(scene.id));
  }

  /**
   * returns the source linked to scene
   */
  getSource(): Source {
    return this.sourcesService.getSource(this.scene.id);
  }

  addSource(sourceId: string, options?: ISceneNodeAddOptions): SceneItem {
    const newItem = this.scene.addSource(sourceId, options);
    return newItem ? this.getItem(newItem.sceneItemId) : null;
  }

  createAndAddSource(name: string, type: TSourceType): SceneItem {
    const newItem = this.scene.createAndAddSource(name, type);
    return newItem ? this.getItem(newItem.sceneItemId) : null;
  }

  createFolder(name: string): SceneItemFolder {
    return this.getFolder(this.scene.createFolder(name).id);
  }

  /**
   * creates sources from file system folders and files
   * source type depends on the file extension
   */
  addFile(path: string, folderId?: string): SceneNode {
    const newNode = this.scene.addFile(path, folderId);
    return newNode ? this.getNode(newNode.id) : null;
  }

  /**
   * removes all nodes from the scene
   */
  clear(): void {
    return this.scene.clear();
  }

  removeFolder(folderId: string): void {
    return this.removeFolder(folderId);
  }

  removeItem(sceneItemId: string): void {
    return this.scene.removeItem(sceneItemId);
  }

  remove(): void {
    this.scene.remove();
  }

  canAddSource(sourceId: string): boolean {
    return this.scene.canAddSource(sourceId);
  }

  setName(newName: string): void {
    return this.scene.setName(newName);
  }

  makeActive(): void {
    return this.scene.makeActive();
  }

  getSelection(ids?: string[]): Selection {
    return new Selection(this.sceneId, ids);
  }
}

export interface ISceneNodeAddOptions {
  id?: string; // A new ID will be assigned if one is not provided
  sourceAddOptions?: ISourceAddOptions;
}

interface ICrop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ISceneItemInfo {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
  locked?: boolean;
  rotation?: number;
}

export interface IScenesState {
  activeSceneId: string;
  displayOrder: string[];
  scenes: Dictionary<IScene>;
}

export interface ITransform {
  position: IVec2;
  scale: IVec2;
  crop: ICrop;
  rotation: number;
}

export interface IPartialTransform {
  position?: Partial<IVec2>;
  scale?: Partial<IVec2>;
  crop?: Partial<ICrop>;
  rotation?: number;
}

export interface ISceneItemSettings {
  transform: ITransform;
  visible: boolean;
  locked: boolean;
}

export interface IPartialSettings {
  transform?: IPartialTransform;
  visible?: boolean;
  locked?: boolean;
}

export interface ISceneItemActions {
  setSettings(settings: Partial<ISceneItemSettings>): void;
  setVisibility(visible: boolean): void;
  setTransform(transform: IPartialTransform): void;
  resetTransform(): void;
  flipX(): void;
  flipY(): void;
  stretchToScreen(): void;
  fitToScreen(): void;
  centerOnScreen(): void;
  rotate(deg: number): void;
  remove(): void;

  /**
   * only for scene sources
   */
  setContentCrop(): void;
}

/**
 * API for scene items and folders
 */
export abstract class SceneNode {
  @Inject('ScenesService') protected internalScenesService: InternalScenesService;
  @InjectFromExternalApi() protected scenesService: ScenesService;
  protected scene: InternalScene;
  protected sceneNode: InternalSceneNode;

  constructor(public sceneId: string, public nodeId: string) {
    this.scene = this.internalScenesService.getScene(sceneId);
    this.sceneNode = this.scene.getNode(this.nodeId);
  }

  getModel(): ISceneNode {
    return {
      id: this.sceneNode.id,
      sceneId: this.sceneNode.sceneId,
      sceneNodeType: this.sceneNode.sceneNodeType,
      parentId: this.sceneNode.parentId,
      childrenIds: this.sceneNode.childrenIds,
    };
  }

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  /**
   * For a source folder, returns an ISelection with the all items and folders in the folder
   * For a scene item, returns an ISelection with only one item
   */
  // getSelection(): ISelection;

  /**
   * Returns parent folder
   */
  getParent(): SceneItemFolder {
    return this.getScene().getFolder(this.sceneNode.parentId);
  }

  /**
   * Sets parent folder
   */
  setParent(parentId: string): void {
    this.sceneNode.setParent(parentId);
  }

  /**
   * Returns true if the node is inside the folder
   */
  hasParent(): boolean {
    return this.sceneNode.hasParent();
  }

  /**
   * After detaching the parent the current node will be a first-level-nesting node
   */
  detachParent(): void {
    return this.sceneNode.detachParent();
  }

  /**
   * Place the current node before provided node
   * This method can change the parent of current node
   */
  placeBefore(nodeId: string): void {
    return this.sceneNode.placeBefore(nodeId);
  }
  /**
   * Place the current node after provided node
   * This method can change the parent of current node
   */
  placeAfter(nodeId: string): void {
    return this.sceneNode.placeAfter(nodeId);
  }

  /**
   * Check the node is scene item
   */
  isItem(): boolean {
    return this.sceneNode.isItem();
  }

  /**
   * Check the node is scene folder
   */
  isFolder(): boolean {
    return this.sceneNode.isFolder();
  }

  /**
   * Removes the node.
   * For folders, all nested folders and items also will be removed.
   * To remove a folder without removing the nested nodes, use the `ISceneItemFolderApi.ungroup()` method
   * @see ISceneItemFolderApi.ungroup()
   */
  remove(): void {
    return this.sceneNode.remove();
  }

  /**
   * Shortcut for `SelectionService.isSelected(id)`
   */
  isSelected(): boolean {
    return this.isSelected();
  }

  /**
   * Shortcut for `SelectionService.select(id)`
   */
  select(): void {
    return this.sceneNode.select();
  }

  /**
   * Shortcut for `SelectionService.add(id)`
   */
  addToSelection(): void {
    return this.sceneNode.addToSelection();
  }

  /**
   * Shortcut for `SelectionService.deselect(id)`
   */
  deselect(): void {
    return this.sceneNode.deselect();
  }

  /**
   * Returns the node index in the list of all nodes
   * To change node index use `placeBefore` and `placeAfter` methods
   */
  getNodeIndex(): number {
    return this.sceneNode.getNodeIndex();
  }

  /**
   * Returns the item index in the list of all nodes.
   * itemIndex defines the draw order of the node
   * itemIndex for a SceneFolder is the itemIndex of the previous SceneItem
   *
   * To change itemIndex use `placeBefore` and `placeAfter` methods
   *
   * <pre>
   * nodeInd | itemInd | nodes tree
   *  0      |    0    | Folder1
   *  1      |    0    |   |_Folder2
   *  2      |    0    |   |_ Item1
   *  3      |    1    |   \_ Item2
   *  4      |    2    | Item3
   *  5      |    2    | Folder3
   *  6      |    3    |   |_Item4
   *  7      |    4    |   \_Item5
   *  </pre>
   */
  getItemIndex(): number {
    return this.getItemIndex();
  }

  /**
   * Returns a node with the previous nodeIndex
   */
  getPrevNode(): SceneNode {
    const node = this.sceneNode.getPrevNode();
    return this.getScene().getNode(node.id);
  }

  /**
   * Returns a node with the next nodeIndex
   */
  getNextNode(): SceneNode {
    const node = this.sceneNode.getPrevNode();
    return this.getScene().getNode(node.id);
  }

  /**
   * Returns the closest next item from the nodes list
   */
  getNextItem(): SceneItem {
    const item = this.sceneNode.getNextItem();
    return this.getScene().getItem(item.id);
  }

  /**
   * Returns the closest previous item from the nodes list
   */
  getPrevItem(): SceneItem {
    const item = this.sceneNode.getPrevItem();
    return this.getScene().getItem(item.id);
  }

  /**
   * Returns a node path - the chain of all parent ids for the node
   */
  getPath(): string[] {
    return this.sceneNode.getPath();
  }
}

@ServiceHelper()
export class SceneItem extends SceneNode implements ISceneItemActions {
  private sceneItem: InternalSceneItem;

  @InjectFromExternalApi() private sourcesService: SourcesService;

  constructor(public sceneId: string, public nodeId: string) {
    super(sceneId, nodeId);
    this.sceneItem = this.internalScenesService.getSceneItem(this.nodeId);
  }

  /**
   * Returns the related source for the current item
   */
  getSource(): Source {
    return this.sourcesService.getSource(this.sceneItem.sourceId);
  }

  getModel(): ISceneItem & ISourceModel {
    return {
      ...this.getSource().getModel(),
      ...super.getModel(),
      sceneItemId: this.sceneItem.sceneItemId,
      transform: this.sceneItem.transform,
      visible: this.sceneItem.visible,
      locked: this.sceneItem.locked,
    };
  }

  setSettings(settings: Partial<ISceneItemSettings>): void {
    return this.sceneItem.setSettings(settings);
  }

  setVisibility(visible: boolean): void {
    return this.sceneItem.setVisibility(visible);
  }

  setTransform(transform: IPartialTransform): void {
    return this.sceneItem.setTransform(transform);
  }

  resetTransform(): void {
    return this.sceneItem.resetTransform();
  }

  flipX(): void {
    return this.sceneItem.flipX();
  }

  flipY(): void {
    return this.sceneItem.flipY();
  }

  stretchToScreen(): void {
    return this.sceneItem.stretchToScreen();
  }

  fitToScreen(): void {
    return this.sceneItem.fitToScreen();
  }

  centerOnScreen(): void {
    return this.sceneItem.centerOnScreen();
  }

  rotate(deg: number): void {
    return this.sceneItem.rotate(deg);
  }

  remove(): void {
    return this.sceneItem.remove();
  }

  /**
   * only for scene sources
   */
  setContentCrop(): void {
    return this.setContentCrop();
  }
}

/**
 * API for folders
 */
@ServiceHelper()
export class SceneItemFolder extends SceneNode {
  private sceneFolder: InternalSceneItemFolder;

  @InjectFromExternalApi() private sourcesService: SourcesService;

  constructor(public sceneId: string, public nodeId: string) {
    super(sceneId, nodeId);
    this.sceneFolder = this.internalScenesService.getScene(sceneId).getFolder(this.nodeId);
  }

  /**
   * serialize folder
   */
  getModel(): ISceneItemFolder {
    return {
      name: this.sceneFolder.name,
      ...super.getModel(),
    };
  }

  /**
   * Returns all direct children items and folders
   * To get all nested children
   * @see getNestedNodes
   */
  getNodes(): SceneNode[] {
    const scene = this.getScene();
    return this.sceneFolder.getNodes().map(node => scene.getNode(node.id));
  }

  /**
   * Returns all direct children items
   */
  getItems(): SceneItem[] {
    const scene = this.getScene();
    return this.sceneFolder.getItems().map(item => scene.getItem(item.id));
  }
  /**
   * Returns all direct children folders
   */
  getFolders(): SceneItemFolder[] {
    const scene = this.getScene();
    return this.sceneFolder.getFolders().map(folder => scene.getFolder(folder.id));
  }

  /**
   * Returns all nested nodes.
   * To get only direct children nodes
   * @see getNodes
   */
  getNestedNodes(): SceneNode[] {
    const scene = this.getScene();
    return this.sceneFolder.getNestedNodes().map(node => scene.getNode(node.id));
  }

  /**
   * Renames the folder
   */
  setName(newName: string): void {
    return this.sceneFolder.setName(newName);
  }

  /**
   * Add an item or folder to the current folder
   * Shortcut for `ISceneNodeApi.setParent()`
   */
  add(sceneNodeId: string): void {
    return this.sceneFolder.add(sceneNodeId);
  }

  /**
   * Removes folder, but keep the all nested nodes untouched
   */
  ungroup(): void {
    return this.sceneFolder.ungroup();
  }
}
