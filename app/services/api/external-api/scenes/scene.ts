import { ServiceHelper } from 'services/core';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { Source, SourcesService } from 'services/api/external-api/sources/sources';
import { Inject } from 'services/core/injector';
import { Scene as InternalScene, ScenesService as InternalScenesService } from 'services/scenes';
import { TSourceType } from 'services/sources';
import { Selection } from './selection';
import { ISceneNodeAddOptions, ScenesService } from './scenes';
import { ISceneNode, SceneNode } from './scene-node';
import { SceneItem } from './scene-item';
import { SceneItemFolder } from './scene-folder';

export interface IScene {
  id: string;
  name: string;
  nodes: ISceneNode[];
}

@ServiceHelper()
export class Scene {
  @InjectFromExternalApi() private scenesService: ScenesService;
  @InjectFromExternalApi() private sourcesService: SourcesService;
  @Inject('ScenesService')
  private internalScenesService: InternalScenesService;

  @Fallback() private scene: InternalScene;

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
    const item = this.scene.getItem(sceneItemId);
    if (!item) return null;
    return item ? new SceneItem(item.sceneId, item.id, item.sourceId) : null;
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
    return this.scene.getRootNodes().map(node => this.getNode(node.id));
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
