import { ISourceApi } from '../../../sources';
import { TNodesList } from '../../../selection';
import { InjectFromExternalApi, Singleton } from '../../external-api';
import { ServiceHelper } from '../../../stateful-service';
import {
  ScenesService as InternalScenesService,
  SceneItemNode as InternalSceneNode,
  SceneItem as InternalSceneItem,
  SceneItemFolder as InternalSceneItemFolder,
  Scene as InternalScene,
  ISceneItemActions,
} from 'services/scenes';
import { Selection as InternalSelection } from 'services/selection';

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
  isSelected(nodeOrNodeId: string | TSceneNodeModel): boolean;
  /**
   * Returns true if selection contains a single scene item
   */
  isSceneItem(): boolean;
  /**
   * Returns true if selection contains a single scene folder
   */
  isSceneFolder(): boolean;

  /**
   * Copy selected item and folders to specific scene or folder
   * For sources duplication use `.copyTo()` method.
   * @see ISelection.copyTo()
   */
  copyTo(sceneId: string, folderId?: string, duplicateSources?: boolean): TSceneNodeApi[];

  /**
   * Do the same as `.copyTo()` and remove copied items
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

  /**
   * Bulk version of `SceneNodeApi.setParent()`
   * @see `SceneNodeApi.setParent()`
   */
  setParent(folderId: string): void;

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
  getRootNodes(): TSceneNodeApi[];

  /**
   * Returns the linked to selection sources
   */
  getSources(): ISourceApi[];
}

export interface ISelectionModel {
  selectedIds: string[];
  lastSelectedId: string;
}

@ServiceHelper()
export class Selection implements ISceneItemActions {


  private selection: InternalSelection;


  constructor(public sceneId: string, itemsList: string[] = []) {
    this.selection = new InternalSelection(sceneId, itemsList);
  }

  getModel(): ISelectionModel {
    return {
      lastSelectedId: this.selection.getLastSelectedId(),
      selectedIds: this.selection.getIds()
    };
  }

  /**
   * Add items to current selection
   */
  add(ids: string[]): Selection {
    this.selection.add(ids);
    return this;
  }
  /**
   * Select items. Previous selected items will be unselected
   */
  select(ids: string[]): Selection {
    this.selection.select(ids);
    return this;
  }
  /**
   * Deselect items
   */
  deselect(ids: string[]): Selection {
    this.selection.deselect(ids);
    return this;
  }
  /**
   * Reset current selection
   */
  reset(): Selection {
    this.selection.reset();
    return this;
  }
  /**
   * Invert current selection.
   * If you need to get an inverted selection without changing the current object use `.getInverted()`
   * @see ISelection.getInverted()
   */
  invert(): Selection {
    this.selection.invert();
    return this;
  }
  /**
   * Select the all items from the scene
   */
  selectAll(): Selection {
    this.selection.selectAll();
    return this;
  }

  /**
   * Returns duplicated Selection
   */
  clone(): Selection {

  }
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
  isSelected(nodeOrNodeId: string | TSceneNodeModel): boolean;
  /**
   * Returns true if selection contains a single scene item
   */
  isSceneItem(): boolean;
  /**
   * Returns true if selection contains a single scene folder
   */
  isSceneFolder(): boolean;

  /**
   * Copy selected item and folders to specific scene or folder
   * For sources duplication use `.copyTo()` method.
   * @see ISelection.copyTo()
   */
  copyTo(sceneId: string, folderId?: string, duplicateSources?: boolean): TSceneNodeApi[];

  /**
   * Do the same as `.copyTo()` and remove copied items
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

  /**
   * Bulk version of `SceneNodeApi.setParent()`
   * @see `SceneNodeApi.setParent()`
   */
  setParent(folderId: string): void;

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
  getRootNodes(): TSceneNodeApi[];

  /**
   * Returns the linked to selection sources
   */
  getSources(): ISourceApi[];
}
