import { ServiceHelper } from '../../../stateful-service';
import { SceneItemFolder as InternalSceneItemFolder } from '../../../scenes';
import { InjectFromExternalApi } from '../../external-api';
import { SourcesService } from '../sources/sources';
import { SceneItem } from './scene-item';
import { ISceneNode, SceneNode } from './scene-node';

export interface ISceneItemFolder extends ISceneNode {
  name: string;
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
