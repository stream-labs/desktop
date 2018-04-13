import {
  ISceneItemActions,
  ISceneItemApi,
  ISceneItem,
  TSceneNodeApi,
  ISceneItemNode,
  ISceneItemFolderApi, TSceneNodeModel
} from 'services/scenes';

/**
 * Represents active items and folders for current scene
 */
export interface ISelectionServiceApi extends ISelection {
}

/**
 * Allows call bulk actions with scene items and folders.
 * Selection can contain items only for one scene.
 * @see Scene.getSelection() to fetch a selection object
 * @see SelectionService to make items active
 */
export interface ISelection extends ISceneItemActions {
  /**
   * Add items to current selection
   */
  add(items: TNodesList): ISelection;
  /**
   * Select items. Previous selected items will be unselected
   */
  select(items: TNodesList): ISelection;
  /**
   * Deselect items
   */
  deselect(items: TNodesList): ISelection;
  /**
   * Reset current selection
   */
  reset(): ISelection;
  /**
   * Invert current selection.
   * If you need to get an inverted selection without changing the current object use `.getInverted()`
   * @see ISelection.getInverted()
   */
  invert(): ISelection;
  /**
   * Select the all items from the scene
   */
  selectAll(): ISelection;

  /**
   * Returns duplicated Selection
   */
  clone(): ISelection;
  /**
   * Returns all selected scene items
   */
  getItems(): ISceneItemApi[];
  /**
   * Returns all selected scene folders
   */
  getFolders(): ISceneItemFolderApi[];

  /**
   * A visual item is visible in the editor and not locked
   */
  getVisualItems(): ISceneItemApi[];

  /**
   * Returns the list of selected folders and items ids
   */
  getIds(): string[];
  /**
   * Returns the inverted list of selected folders and items ids
   */
  getInvertedIds(): string[];
  /**
   * Returns the inverted selection. The current object will not change.
   * To change the current object use `.invert()`
   * @see ISelection.invert()
   */
  getInverted(): TSceneNodeApi[];

  /**
   * Returns a minimal bounding rectangle for selected items.
   */
  getBoundingRect(): IRectangle;

  /**
   * Returns the last item or folder added to selection
   */
  getLastSelected(): TSceneNodeApi;
  /**
   * Returns the id of the last item or folder added to selection
   */
  getLastSelectedId(): string;

  /**
   * Returns the selection size
   */
  getSize(): number;
  /**
   * Check the item is selected
   */
  isSelected(nodeOrNodeId: string | TSceneNodeModel): void;
  /**
   * Returns true if selection contains a single scene item
   */
  isSceneItem(): boolean;
  /**
   * Returns true if selection contains a single scene folder
   */
  isSceneFolder(): boolean;

  /**
   * Copy selected items to any scene. The sources for each item will be also duplicated.
   * For the most cases use `.copyReferenceTo()` to avoid sources duplication.
   * @see ISelection.copyReferenceTo()
   */
  copyTo(sceneId: string): ISceneItem[];

  /**
   * Copy selected item and folders to specific scene or folder. The sources will not be duplicated.
   * For sources duplication use `.copyTo()` method.
   * @see ISelection.copyTo()
   */
  copyReferenceTo(sceneId: string, folderId?: string): TSceneNodeApi[];

  /**
   * Do the same as `.copyReferenceTo()` and remove copied items
   */
  moveTo(sceneId: string, folderId?: string): TSceneNodeApi[];

  /**
   * Bulk version of `SceneNodeApi.placeAfter()`
   * @see `SceneNodeApi.placeAfter()`
   */
  placeAfter(sceneNodeId: string): void;

  /**
   * Bulk version of `SceneNodeApi.placeBefore()`
   * @see `SceneNodeApi.placeBefore()`
   */
  placeBefore(sceneNodeId: string): void;
}

export interface ISelectionState {
  selectedIds: string[];
  lastSelectedId: string;
}

/**
 * list of ISceneNode.id or ISceneNode
 */
export type TNodesList = string | string[] | ISceneItemNode | ISceneItemNode[];
