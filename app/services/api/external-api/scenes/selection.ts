import { InjectFromExternalApi, Singleton, Fallback } from 'services/api/external-api';
import { ServiceHelper } from 'services/stateful-service';
import { ISceneItemActions, ISceneItemSettings, IPartialTransform } from 'services/scenes';
import {
  Selection as InternalSelection,
  SelectionService as InternalSelectionService,
} from 'services/selection';
import { ScenesService } from './scenes';
import { Source, SourcesService } from 'services/api/external-api/sources/sources';
import { Inject } from 'util/injector';
import { Scene } from './scene';
import { SceneItem } from './scene-item';
import { SceneItemFolder } from './scene-folder';
import { SceneNode } from './scene-node';

export interface ISelectionModel {
  selectedIds: string[];
  lastSelectedId: string;
}

/**
 * Allows call bulk actions with scene items and folders.
 * Selection can contain items only for one scene.
 * @see Scene.getSelection() to fetch a selection object
 * @see SelectionService to make items active
 */
@ServiceHelper()
export class Selection implements ISceneItemActions {
  @InjectFromExternalApi() private sourcesService: SourcesService;
  @InjectFromExternalApi() private scenesService: ScenesService;
  private internalSelection: InternalSelection;

  constructor(public sceneId?: string, itemsList: string[] = []) {
    if (!this.sceneId) return;
    this.internalSelection = new InternalSelection(sceneId, itemsList);
  }

  get selection(): InternalSelection | InternalSelectionService {
    return this.internalSelection;
  }

  /**
   * returns serializable representation of selection
   */
  getModel(): ISelectionModel {
    return {
      lastSelectedId: this.selection.getLastSelectedId(),
      selectedIds: this.selection.getIds(),
    };
  }

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
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
    return this.scenesService.getScene(this.sceneId).getSelection(this.getIds());
  }
  /**
   * Returns all selected scene items
   */
  getItems(): SceneItem[] {
    const scene = this.scenesService.getScene(this.sceneId);
    return this.selection.getItems().map(item => scene.getItem(item.id));
  }
  /**
   * Returns all selected scene folders
   */
  getFolders(): SceneItemFolder[] {
    const scene = this.scenesService.getScene(this.sceneId);
    return this.selection.getFolders().map(folder => scene.getFolder(folder.id));
  }

  /**
   * A visual item is visible in the editor and not locked
   */
  getVisualItems(): SceneItem[] {
    const scene = this.scenesService.getScene(this.sceneId);
    return this.selection.getVisualItems().map(item => scene.getItem(item.id));
  }

  /**
   * Returns the list of selected folders and items ids
   */
  getIds(): string[] {
    return this.selection.getIds();
  }
  /**
   * Returns the inverted list of selected folders and items ids
   */
  getInvertedIds(): string[] {
    return this.selection.getInvertedIds();
  }
  /**
   * Returns the inverted selection. The current object will not be changed.
   * To change the current object use `.invert()`
   * @see ISelection.invert()
   */
  getInverted(): SceneNode[] {
    const scene = this.getScene();
    return this.selection.getInvertedIds().map(id => scene.getNode(id));
  }

  /**
   * Returns a minimal bounding rectangle for selected items.
   */
  getBoundingRect(): IRectangle {
    return this.selection.getBoundingRect();
  }

  /**
   * Returns the last item or folder added to selection
   */
  getLastSelected(): SceneNode {
    return this.getScene().getNode(this.getLastSelectedId());
  }
  /**
   * Returns the id of the last item or folder added to selection
   */
  getLastSelectedId(): string {
    return this.selection.getLastSelectedId();
  }

  /**
   * Returns the selection size
   */
  getSize(): number {
    return this.selection.getSize();
  }
  /**
   * Check the node is selected
   */
  isSelected(nodeId: string): boolean {
    return this.selection.isSelected(nodeId);
  }

  /**
   * Copy selected item and folders to specific scene or folder
   * For sources duplication use `.copyTo()` method.
   * @see ISelection.copyTo()
   */
  copyTo(sceneId: string, folderId?: string, duplicateSources?: boolean): void {
    this.selection.copyTo(sceneId, folderId, duplicateSources);
  }

  /**
   * Do the same as `.copyTo()` and remove copied items
   */
  moveTo(sceneId: string, folderId?: string): void {
    this.selection.moveTo(sceneId, folderId);
  }

  /**
   * Bulk version of `SceneNodeApi.placeAfter()`
   * @see `SceneNodeApi.placeAfter()`
   */
  placeAfter(sceneNodeId: string): void {
    this.selection.placeAfter(sceneNodeId);
  }

  /**
   * Bulk version of `SceneNodeApi.placeBefore()`
   * @see `SceneNodeApi.placeBefore()`
   */
  placeBefore(sceneNodeId: string): void {
    this.selection.placeBefore(sceneNodeId);
  }

  /**
   * Bulk version of `SceneNodeApi.setParent()`
   * @see `SceneNodeApi.setParent()`
   */
  setParent(folderId: string): void {
    this.selection.setParent(folderId);
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
  getRootNodes(): SceneNode[] {
    const scene = this.getScene();
    return this.selection.getRootNodes().map(node => scene.getNode(node.id));
  }

  /**
   * Returns the linked to selection sources
   */
  getSources(): Source[] {
    return this.selection
      .getSources()
      .map(source => this.sourcesService.getSource(source.sourceId));
  }

  setSettings(settings: Partial<ISceneItemSettings>): void {
    return this.selection.setSettings(settings);
  }

  setVisibility(visible: boolean): void {
    return this.selection.setVisibility(visible);
  }

  setTransform(transform: IPartialTransform): void {
    return this.selection.setTransform(transform);
  }

  resetTransform(): void {
    return this.selection.resetTransform();
  }

  flipX(): void {
    return this.selection.flipX();
  }

  flipY(): void {
    return this.selection.flipY();
  }

  stretchToScreen(): void {
    return this.selection.stretchToScreen();
  }

  fitToScreen(): void {
    return this.selection.fitToScreen();
  }

  centerOnScreen(): void {
    return this.selection.centerOnScreen();
  }

  rotate(deg: number): void {
    return this.selection.rotate(deg);
  }

  remove(): void {
    return this.selection.remove();
  }

  /**
   * only for scene sources
   */
  setContentCrop(): void {
    return this.selection.setContentCrop();
  }

  scale(scale: IVec2, origin?: IVec2) {
    return this.selection.scale(scale, origin);
  }

  scaleWithOffset(scale: IVec2, offset: IVec2) {
    return this.selection.scale(scale, offset);
  }
}

/**
 * Allows select/deselect items
 */
@Singleton()
export class SelectionService extends Selection {
<<<<<<< HEAD
  @Fallback()
  @Inject('SelectionService')
  internalSelectionService: InternalSelectionService;
=======
  @Inject('SelectionService') internalSelectionService: InternalSelectionService;
>>>>>>> staging2

  get selection() {
    return this.internalSelectionService;
  }
}
