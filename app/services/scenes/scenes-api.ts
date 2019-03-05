import { Observable } from 'rxjs';
import { ISourceApi, TSourceType, ISource, ISourceAddOptions } from 'services/sources';
import { ISelection, TNodesList } from 'services/selection';
import { AnchorPoint, AnchorPositions } from '../../util/ScalableRectangle';

/**
 * Api for scenes management
 */
export interface IScenesServiceApi {
  createScene(name: string, options?: ISceneCreateOptions): ISceneApi;
  makeSceneActive(id: string): boolean;
  removeScene(id: string): IScene;
  scenes: ISceneApi[];
  activeScene: ISceneApi;
  activeSceneId: string;
  getScene(id: string): ISceneApi;
  getScenes(): ISceneApi[];
  getModel(): IScenesState;
  suggestName(name: string): string;
  sceneSwitched: Observable<IScene>;
  sceneAdded: Observable<IScene>;
  sceneRemoved: Observable<IScene>;
  itemAdded: Observable<ISceneItem>;
  itemRemoved: Observable<ISceneItem>;
  itemUpdated: Observable<ISceneItem>;
}

export type TSceneNodeModel = ISceneItem | ISceneItemFolder;
export type TSceneNodeApi = ISceneItemApi | ISceneItemFolderApi;

export interface IScene extends IResource {
  id: string;
  name: string;
  nodes: (ISceneItem | ISceneItemFolder)[];
}

export interface ISceneApi extends IScene {
  getNode(sceneNodeId: string): TSceneNodeApi;
  getNodeByName(name: string): TSceneNodeApi;
  getItem(sceneItemId: string): ISceneItemApi;
  getFolder(sceneFolderId: string): ISceneItemFolderApi;
  getNodes(): TSceneNodeApi[];
  getRootNodes(): TSceneNodeApi[];
  getItems(): ISceneItemApi[];
  getFolders(): ISceneItemFolderApi[];

  /**
   * returns scene items of scene + scene items of nested scenes
   */
  getNestedItems(): ISceneItemApi[];

  /**
   * returns sources of scene + sources of nested scenes
   * result also includes nested scenes
   */
  getNestedSources(): ISourceApi[];

  /**
   * return nested scenes in the safe-to-add order
   */
  getNestedScenes(): ISceneApi[];

  /**
   * returns the source linked to scene
   */
  getSource(): ISourceApi;

  addSource(sourceId: string, options?: ISceneNodeAddOptions): ISceneItemApi;
  createAndAddSource(name: string, type: TSourceType): ISceneItemApi;
  createFolder(name: string): ISceneItemFolderApi;

  /**
   * creates sources from file system folders and files
   * source type depends on the file extension
   */
  addFile(path: string, folderId?: string): TSceneNodeApi;

  /**
   * removes all nodes from the scene
   */
  clear(): void;
  removeFolder(folderId: string): void;
  removeItem(sceneItemId: string): void;
  remove(): void;
  canAddSource(sourceId: string): boolean;
  setName(newName: string): void;
  getModel(): IScene;
  makeActive(): void;
  getSelection(itemsList?: TNodesList): ISelection;
}

export interface ISceneNodeAddOptions {
  id?: string; // A new ID will be assigned if one is not provided
  sourceAddOptions?: ISourceAddOptions;
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

export interface ISceneCreateOptions {
  duplicateSourcesFromScene?: string;
  sceneId?: string; // A new ID will be generated if one is not provided
  makeActive?: boolean;
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

export interface ISceneItem extends ISceneItemSettings, ISceneItemNode {
  sceneItemId: string;
  sourceId: string;
  obsSceneItemId: number;
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
  scale(scale: IVec2, origin: IVec2): void;
  scaleWithOffset(scale: IVec2, offset: IVec2): void;

  /**
   * only for scene sources
   */
  setContentCrop(): void;
}

export interface ISceneItemApi extends ISceneItem, ISceneItemActions, ISceneNodeApi {
  name: string;

  /**
   * Returns the related source for the current item
   */
  getSource(): ISourceApi;
  getModel(): ISceneItem & ISource;
  setScale(scale: IVec2, origin: IVec2): void;
}

export type TSceneNodeType = 'item' | 'folder';

export interface ISceneItemNode extends IResource {
  id: string;
  sceneId: string;
  sceneNodeType: TSceneNodeType;
  parentId?: string;
  childrenIds?: string[];
}

/**
 * API for scene items and folders
 */
export interface ISceneNodeApi extends ISceneItemNode {
  getScene(): ISceneApi;

  /**
   * For a source folder, returns an ISelection with the all items and folders in the folder
   * For a scene item, returns an ISelection with only one item
   */
  getSelection(): ISelection;

  /**
   * Returns parent folder
   */
  getParent(): ISceneItemFolderApi;

  /**
   * Sets parent folder
   */
  setParent(parentId: string): void;

  /**
   * Returns true if the node is inside the folder
   */
  hasParent(): void;

  /**
   * After detaching the parent the current node will be a first-level-nesting node
   */
  detachParent(): void;

  /**
   * Place the current node before provided node
   * This method can change the parent of current node
   */
  placeBefore(nodeId: string): void;
  /**
   * Place the current node after provided node
   * This method can change the parent of current node
   */
  placeAfter(nodeId: string): void;

  /**
   * Check the node is scene item
   */
  isItem(): boolean;

  /**
   * Check the node is scene folder
   */
  isFolder(): boolean;

  /**
   * Removes the node.
   * For folders, all nested folders and items also will be removed.
   * To remove a folder without removing the nested nodes, use the `ISceneItemFolderApi.ungroup()` method
   * @see ISceneItemFolderApi.ungroup()
   */
  remove(): void;

  /**
   * Shortcut for `SelectionService.isSelected(id)`
   */
  isSelected(): boolean;

  /**
   * Shortcut for `SelectionService.select(id)`
   */
  select(): void;

  /**
   * Shortcut for `SelectionService.add(id)`
   */
  addToSelection(): void;

  /**
   * Shortcut for `SelectionService.deselect(id)`
   */
  deselect(): void;

  /**
   * Returns the node index in the list of all nodes
   * To change node index use `placeBefore` and `placeAfter` methods
   */
  getNodeIndex(): number;

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
  getItemIndex(): number;

  /**
   * Returns a node with the previous nodeIndex
   */
  getPrevNode(): TSceneNodeApi;

  /**
   * Returns a node with the next nodeIndex
   */
  getNextNode(): TSceneNodeApi;

  /**
   * Returns the closest next item from the nodes list
   */
  getNextItem(): ISceneItemApi;

  /**
   * Returns the closest previous item from the nodes list
   */
  getPrevItem(): ISceneItemApi;

  /**
   * Returns the next sibling node if it exists
   */
  getNextSiblingNode(): TSceneNodeApi;

  /**
   * Returns the previous sibling node if it exists
   */
  getPrevSiblingNode(): TSceneNodeApi;

  /**
   * Returns a node path - the chain of all parent ids for the node
   */
  getPath(): string[];
}

export interface ISceneItemFolder extends ISceneItemNode {
  name: string;
}

/**
 * API for scene folders
 */
export interface ISceneItemFolderApi extends ISceneItemFolder, ISceneNodeApi {
  /**
   * Returns all direct children items and folders
   * To get all nested children
   * @see getNestedNodes
   */
  getNodes(): TSceneNodeApi[];

  /**
   * Returns all direct children items
   */
  getItems(): ISceneItemApi[];

  /**
   * Returns all direct children folders
   */
  getFolders(): ISceneItemFolderApi[];

  /**
   * Returns all nested nodes.
   * To get only direct children nodes
   * @see getNodes
   */
  getNestedNodes(): TSceneNodeApi[];

  /**
   * Returns all nested items
   */
  getNestedItems(): ISceneItemApi[];

  /**
   * Returns all nested folders
   */
  getNestedFolders(): ISceneItemFolderApi[];

  getNestedNodesIds(): string[];
  getNestedItemsIds(): string[];
  getNestedFoldersIds(): string[];

  /**
   * Renames the folder
   */
  setName(newName: string): void;

  /**
   * Add an item or folder to the current folder
   * Shortcut for `ISceneNodeApi.setParent()`
   */
  add(sceneNodeId: string): void;

  /**
   * Removes folder, but keep the all nested nodes untouched
   */
  ungroup(): void;

  getModel(): ISceneItemFolder;
}
