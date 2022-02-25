import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { ServiceHelper } from 'services/core';
import { ISceneItemActions, ISceneItemSettings, IPartialTransform } from 'services/scenes';
import {
  Selection as InternalSelection,
  SelectionService as InternalSelectionService,
} from 'services/selection';
import { ScenesService } from './scenes';
import { Source, SourcesService } from 'services/api/external-api/sources';

import { Scene } from './scene';
import { SceneItem } from './scene-item';
import { SceneItemFolder } from './scene-item-folder';
import { SceneNode } from './scene-node';
import { ISerializable } from '../../rpc-api';

/**
 * Serialized representation of a {@link Selection}.
 */
export interface ISelectionModel {
  selectedIds: string[];
  lastSelectedId: string;
}

/**
 * API for selection operations. Allows bulk actions on scene nodes (scene items
 * and folders). Selection can contain items only for one scene.
 *
 * Use {@link Scene.getSelection} to fetch a new {@link Selection} object.
 */
@ServiceHelper()
export class Selection implements ISceneItemActions, ISerializable {
  @InjectFromExternalApi() private sourcesService: SourcesService;
  @InjectFromExternalApi() private scenesService: ScenesService;
  @Fallback() private internalSelection: InternalSelection;

  constructor(sceneId: string, itemsList: string[] = []) {
    this.internalSelection = new InternalSelection(sceneId, itemsList);
  }

  private isDestroyed(): boolean {
    return this.internalSelection.isDestroyed();
  }

  /**
   * @returns The id of the scene the selection is applied to
   */
  get sceneId(): string {
    return this.internalSelection.sceneId;
  }

  protected get selection(): InternalSelection {
    return this.internalSelection;
  }

  /**
   * @returns A serializable representation of this {@link Selection}
   */
  getModel(): ISelectionModel {
    return {
      lastSelectedId: this.selection.getLastSelectedId(),
      selectedIds: this.selection.getIds(),
    };
  }

  /**
   * @returns The scene the selection applies to
   */
  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  /**
   * Adds items to current {@link Selection}.
   *
   * @param ids The ids of the items to add.
   * @returns This selection
   */
  add(ids: string[]): Selection {
    this.selection.add(ids);
    return this;
  }

  /**
   * Selects items. Previous selected items will be unselected.
   *
   * @param ids ids of the items to select
   * @returns This selection
   */
  select(ids: string[]): Selection {
    this.selection.select(ids);
    return this;
  }

  /**
   * Deselects items.
   *
   * @param ids ids of the items to deselect
   * @returns This selection
   */
  deselect(ids: string[]): Selection {
    this.selection.deselect(ids);
    return this;
  }

  /**
   * Resets current selection.
   *
   * @returns This selection
   */
  reset(): Selection {
    this.selection.reset();
    return this;
  }

  /**
   * Inverts current selection. If you need to get an inverted selection without
   * changing the current object use {@link getInverted}.
   *
   * @returns This selection
   * @see getInverted
   */
  invert(): Selection {
    this.selection.invert();
    return this;
  }

  /**
   * Selects all items from the scene.
   *
   * @returns This selection
   */
  selectAll(): Selection {
    this.selection.selectAll();
    return this;
  }

  /**
   * Returns a duplication of this {@link Selection}.
   *
   * @returns A new instance of {@link Selection} containing all items of
   * {@link getIds}.
   */
  clone(): Selection {
    return this.scenesService.getScene(this.sceneId).getSelection(this.getIds());
  }

  /**
   * @returns All selected {@link SceneItem}s
   */
  getItems(): SceneItem[] {
    const scene = this.scenesService.getScene(this.sceneId);
    return this.selection.getItems().map(item => scene.getItem(item.id));
  }

  /**
   * @returns All selected {@link SceneItemFolder}s
   */
  getFolders(): SceneItemFolder[] {
    const scene = this.scenesService.getScene(this.sceneId);
    return this.selection.getFolders().map(folder => scene.getFolder(folder.id));
  }

  /**
   * Note: A visual item is visible in the editor and not locked.
   *
   * @returns All visual {@link SceneItem}s
   */
  getVisualItems(): SceneItem[] {
    const scene = this.scenesService.getScene(this.sceneId);
    return this.selection.getVisualItems().map(item => scene.getItem(item.id));
  }

  /**
   * @returns The list of selected folders and items ids
   */
  getIds(): string[] {
    return this.selection.getIds();
  }

  /**
   * @returns The inverted list of selected folders and items ids
   */
  getInvertedIds(): string[] {
    return this.selection.getInvertedIds();
  }

  /**
   * Returns the nodes of the scene this selection applies that are not
   * selected. The current selection will not be changed. To change it use
   * {@link invert}.
   *
   * @returns The {@link SceneNode}s of the selection's inversion
   * @see invert
   */
  getInverted(): SceneNode[] {
    const scene = this.getScene();
    return this.selection.getInvertedIds().map(id => scene.getNode(id));
  }

  /**
   * @returns A minimal bounding rectangle for the selected items
   */
  getBoundingRect(): IRectangle {
    return this.selection.getBoundingRect();
  }

  /**
   * @returns The last item or folder added to selection
   */
  getLastSelected(): SceneNode {
    return this.getScene().getNode(this.getLastSelectedId());
  }

  /**
   * @returns The id of the last item or folder added to selection
   */
  getLastSelectedId(): string {
    return this.selection.getLastSelectedId();
  }

  /**
   * @returns The selection size
   */
  getSize(): number {
    return this.selection.getSize();
  }

  /**
   * Checks if the node with the provided id is selected.
   *
   * @param nodeId The id of the node
   * @returns `true` of the node is selected
   */
  isSelected(nodeId: string): boolean {
    return this.selection.isSelected(nodeId);
  }

  /**
   * Copies selected items and folders to specific scene or folder.
   *
   * @param sceneId The id of the scene to copy the files into
   * @param folderId The id of a folder inside the scene
   * @param duplicateSources set to true of the sources should be duplicated
   * @see moveTo
   */
  copyTo(sceneId: string, folderId?: string, duplicateSources?: boolean): void {
    this.selection.copyTo(sceneId, folderId, duplicateSources);
  }

  /**
   * Moves selected items and folders to specific scene or folder.
   *
   * @see copyTo
   */
  moveTo(sceneId: string, folderId?: string): void {
    this.selection.moveTo(sceneId, folderId);
  }

  /**
   * Places selected items and folders after the node provided. This is a bulk
   * version of {@link SceneNode.placeAfter}.
   *
   * @param sceneNodeId the id of the {@link SceneNode} the items and folders
   * should be placed after it
   * @see SceneNode.placeAfter
   */
  placeAfter(sceneNodeId: string): void {
    this.selection.placeAfter(sceneNodeId);
  }

  /**
   * Places selected items and folders before the node provided. This is a bulk
   * version of {@link SceneNode.placeBefore}.
   *
   * @param sceneNodeId the id of the {@link SceneNode} the items and folders
   * should be placed before it
   * @see SceneNode.placeBefore
   */
  placeBefore(sceneNodeId: string): void {
    this.selection.placeBefore(sceneNodeId);
  }

  /**
   * Sets selected items and folders parent (folder) id. This moves all nodes
   * into the provided folder. This is a bulk version of
   * {@link SceneNode.setParent}.
   *
   * @param folderId The id of the folder to set as parent
   * @see SceneNode.setParent
   */
  setParent(folderId: string): void {
    this.selection.setParent(folderId);
  }

  /**
   * Returns a minimal representation of the selection's root nodes. For
   * selection list like this:
   * ```
   * Folder1      <- selected
   *  |_ Item1    <- selected
   *  \_ Folder2  <- selected
   * Item3        <- selected
   * Folder3
   *  |_ Item4
   *  \_ Item5    <- selected
   * ```
   * the return array would be [Folder1, Item3, Item5].
   *
   * @returns An array with all root nodes
   */
  getRootNodes(): SceneNode[] {
    const scene = this.getScene();
    return this.selection.getRootNodes().map(node => scene.getNode(node.id));
  }

  /**
   * @returns The linked to selection sources
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

  setStreamVisible(streamVisible: boolean): void {
    return this.selection.setStreamVisible(streamVisible);
  }

  setRecordingVisible(recordingVisible: boolean): void {
    return this.selection.setRecordingVisible(recordingVisible);
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
   * Sets the content crop. Applicable only for scene sources.
   */
  setContentCrop(): void {
    return this.selection.setContentCrop();
  }

  scale(scale: IVec2, origin?: IVec2): void {
    return this.selection.scale(scale, origin);
  }

  scaleWithOffset(scale: IVec2, offset: IVec2): void {
    return this.selection.scale(scale, offset);
  }

  /**
   * @returns `true` if selection contains only one {@link SceneItemFolder}
   */
  isSceneFolder(): boolean {
    return this.selection.isSceneFolder();
  }

  /**
   * @returns `true` if selection contains only one {@link SceneItem}
   */
  isSceneItem(): boolean {
    return this.selection.isSceneFolder();
  }
}
