import { ServiceHelper } from 'services/core';
import { SceneItemFolder as InternalSceneItemFolder } from 'services/scenes';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { SourcesService } from 'services/api/external-api/sources/sources';
import { SceneItem } from './scene-item';
import { ISceneNodeModel, SceneNode } from './scene-node';
import { Selection } from './selection';

export interface ISceneItemFolderModel extends ISceneNodeModel {
  name: string;
}

/**
 * API for folders
 */
@ServiceHelper()
export class SceneItemFolder extends SceneNode {
  @Fallback() private sceneFolder: InternalSceneItemFolder;
  @InjectFromExternalApi() private sourcesService: SourcesService;

  constructor(public sceneId: string, public nodeId: string) {
    super(sceneId, nodeId);
    this.sceneFolder = this.internalScenesService.getScene(sceneId).getFolder(this.nodeId);
  }

  /**
   * serialize folder
   */
  getModel(): ISceneItemFolderModel {
    return {
      name: this.sceneFolder.name,
      childrenIds: this.sceneNode.childrenIds,
      ...super.getModel(),
    };
  }

  /**
   * Returns all direct children
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
   * A shortcut for `SceneNode.setParent()`
   * @see SceneNode.setParent()
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

  /**
   * Returns a Selection object
   * Helpful for bulk operations
   */
  getSelection(): Selection {
    // convert InternalSelection to ExternalSelection
    return this.getScene().getSelection(this.sceneFolder.getSelection().getIds());
  }
}
