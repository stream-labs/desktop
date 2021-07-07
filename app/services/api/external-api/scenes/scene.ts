import { ServiceHelper, Inject } from 'services';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { Source, SourcesService } from 'services/api/external-api/sources';
import { Scene as InternalScene, ScenesService as InternalScenesService } from 'services/scenes';
import { TSourceType } from 'services/sources';
import { Selection } from './selection';
import { ISceneNodeAddOptions, ScenesService } from './scenes';
import { ISceneNodeModel, SceneNode } from './scene-node';
import { getExternalSceneItemModel, SceneItem } from './scene-item';
import { SceneItemFolder } from './scene-item-folder';
import Utils from '../../../utils';
import { ISerializable } from '../../rpc-api';

/**
 * Serialized representation of a {@link Scene}.
 */
export interface ISceneModel {
  id: string;
  name: string;
  nodes: ISceneNodeModel[];
}

/**
 * API for scene management. Provides various operations for managing the scene
 * nodes of this scene, including grouping and ungrouping of scene nodes,
 * creating, reordering and removing sources from this scene. For more general
 * scene operations see {@link ScenesService}.
 */
@ServiceHelper()
export class Scene implements ISceneModel, ISerializable {
  @InjectFromExternalApi() private scenesService: ScenesService;
  @InjectFromExternalApi() private sourcesService: SourcesService;
  @Inject('ScenesService')
  private internalScenesService: InternalScenesService;
  name: string;
  id: string;
  nodes: ISceneNodeModel[];

  @Fallback() private scene: InternalScene;

  constructor(private sceneId: string) {
    this.scene = this.internalScenesService.views.getScene(sceneId);
    Utils.applyProxy(this, () => this.getModel());
  }

  private isDestroyed(): boolean {
    return this.scene.isDestroyed();
  }

  /**
   * @returns A serialized representation of this {@link Scene}
   */
  getModel(): ISceneModel {
    return {
      id: this.scene.id,
      name: this.scene.name,
      nodes: this.getNodes().map(node => node.getModel()),
    };
  }

  /**
   * Returns a specific scene node with id {@param sceneNodeId}.
   *
   * @param sceneNodeId The id of the scene node
   * @returns SceneNode with the provided id or `null` if no scene node found
   */
  getNode(sceneNodeId: string): SceneNode | null {
    const node = this.scene.getNode(sceneNodeId);
    if (!node) return null;
    return node.sceneNodeType === 'folder'
      ? this.getFolder(sceneNodeId)
      : this.getItem(sceneNodeId);
  }

  /**
   * Returns a specific scene node with the provided {@param name}.
   *
   * @param name The the name of the scene node
   * @returns SceneNode with the provided name or `null` if no scene scene node
   * found
   */
  getNodeByName(name: string): SceneNode | null {
    const node = this.scene.getNodeByName(name);
    return node ? this.getNode(node.id) : null;
  }

  /**
   * Returns a specific scene item with the provided {@param sceneItemId}.
   *
   * @param sceneItemId The id of the scene item
   * @returns The scene item with the specified id or `null` if not found or
   * not a {@link SceneItem}
   */
  getItem(sceneItemId: string): SceneItem | null {
    const item = this.scene.getItem(sceneItemId);
    if (!item) return null;
    return item ? new SceneItem(item.sceneId, item.id, item.sourceId) : null;
  }

  /**
   * Returns a specific scene folder with the provided {@param sceneFolderId}.
   *
   * @param sceneFolderId The id of the scene folder
   * @returns The scene folder with the specified id or `null` if not found or
   * not a {@link SceneItemFolder}
   */
  getFolder(sceneFolderId: string): SceneItemFolder | null {
    const folder = this.scene.getFolder(sceneFolderId);
    if (!folder) return null;
    return folder ? new SceneItemFolder(folder.sceneId, folder.id) : null;
  }

  /**
   * @returns A list of all nodes of this scene
   */
  getNodes(): SceneNode[] {
    return this.scene.getNodes().map(node => this.getNode(node.id));
  }

  /**
   * @returns A list of all root nodes of this scene
   */
  getRootNodes(): SceneNode[] {
    return this.scene.getRootNodes().map(node => this.getNode(node.id));
  }

  /**
   * @returns A list of all scene items of this scene
   */
  getItems(): SceneItem[] {
    return this.scene.getItems().map(item => this.getItem(item.id));
  }

  /**
   * @returns A list of all scene folders of this scene
   */
  getFolders(): SceneItemFolder[] {
    return this.scene.getFolders().map(folder => this.getFolder(folder.id));
  }

  /**
   * @returns A list of all scene items of this scene and all nested scenes
   */
  getNestedItems(): SceneItem[] {
    return this.scene.getNestedItems().map(item => this.getItem(item.id));
  }

  /**
   * @returns A list of all sources of this scene and all nested scenes
   */
  getNestedSources(): Source[] {
    return this.scene
      .getNestedSources()
      .map(source => this.sourcesService.getSource(source.sourceId));
  }

  /**
   * @returns A list of all nested scenes in the safe-to-add order
   */
  getNestedScenes(): Scene[] {
    return this.scene.getNestedScenes().map(scene => this.scenesService.getScene(scene.id));
  }

  /**
   * @returns The source linked to this scene
   */
  getSource(): Source {
    return this.sourcesService.getSource(this.scene.id);
  }

  /**
   * Adds a source with the provided id and options to this scene.
   *
   * @param sourceId The id of the source
   * @param options The options of the source
   * @returns The created {@link SceneItem} of the source that was added to this
   * scene or `null` if the source could not be added to the scene
   */
  addSource(sourceId: string, options?: ISceneNodeAddOptions): SceneItem | null {
    const newItem = this.scene.addSource(sourceId, options);
    return newItem ? this.getItem(newItem.sceneItemId) : null;
  }

  /**
   * Creates and adds a source to this scene.
   *
   * @param name The name of the source
   * @param type The type of the source
   * @param settings The settings of the source
   * @returns The created {@link SceneItem} of the source that was created and
   * added to this scene or `null` if the source could not be added to the scene
   */
  createAndAddSource(
    name: string,
    type: TSourceType,
    settings?: Dictionary<any>,
  ): SceneItem | null {
    const newItem = this.scene.createAndAddSource(name, type, settings);
    return newItem ? this.getItem(newItem.sceneItemId) : null;
  }

  /**
   * Creates a new folder with the provided {@param name}.
   *
   * @param name The name of the folder
   * @returns The created {@link SceneItemFolder} of the newly created folder
   */
  createFolder(name: string): SceneItemFolder {
    return this.getFolder(this.scene.createFolder(name).id);
  }

  /**
   * Creates sources from file system folders and files. Source type depends on
   * the file extensions.
   *
   * @param path The path to the files
   * @param folderId The id of the folder to add the created scene nodes
   */
  addFile(path: string, folderId?: string): SceneNode {
    const newNode = this.scene.addFile(path, folderId);
    return newNode ? this.getNode(newNode.id) : null;
  }

  /**
   * Removes all nodes from this scene.
   */
  clear(): void {
    return this.scene.clear();
  }

  /**
   * Removes the folder with the specified {@param folderId}.
   *
   * @param folderId The id of the folder to remove
   */
  removeFolder(folderId: string): void {
    return this.scene.removeFolder(folderId);
  }

  /**
   * Removes the item with the specified {@param sceneItemId}.
   *
   * @param sceneItemId The id of the scene item to remove
   */
  removeItem(sceneItemId: string): void {
    return this.scene.removeItem(sceneItemId);
  }

  /**
   * Removes this scene. Shortcut for {@link ScenesService.removeScene}.
   *
   * @see ScenesService.removeScene
   */
  remove(): void {
    this.scene.remove();
  }

  /**
   * Checks if the source with the specified id can be added to scene.
   *
   * @param sourceId The id of the source to check
   * @returns `true` if the source can be added to this scene, `false` otherwise
   */
  canAddSource(sourceId: string): boolean {
    return this.scene.canAddSource(sourceId);
  }

  /**
   * Changes the name of this scene.
   *
   * @param newName The new name of the scene
   */
  setName(newName: string): void {
    return this.scene.setName(newName);
  }

  /**
   * Switches to this scene. Shortcut for {@link ScenesService.makeSceneActive}.
   *
   * @see ScenesService.makeSceneActive
   */
  makeActive(): void {
    return this.scene.makeActive();
  }

  /**
   * Creates a {@link Selection} object and selects all nodes with the given
   * ids (if provided).
   *
   * @param ids The ids of the nodes to select
   * @returns A new {@link Selection} object of all the nodes that were found
   */
  getSelection(ids?: string[]): Selection {
    return new Selection(this.sceneId, ids);
  }
}
