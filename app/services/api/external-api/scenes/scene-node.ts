import { Inject } from 'services/core/injector';
import {
  Scene as InternalScene,
  SceneItemNode as InternalSceneNode,
  ScenesService as InternalScenesService,
} from 'services/scenes';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { ScenesService } from './scenes';
import { Scene } from './scene';
import { SceneItemFolder } from './scene-folder';
import { SceneItem } from './scene-item';

export declare type TSceneNodeType = 'folder' | 'item';

export interface ISceneNode {
  id: string;
  sceneId: string;
  sceneNodeType: TSceneNodeType;
  parentId?: string;
  childrenIds?: string[];
}

/**
 * A base API for Items and Folders
 */
export abstract class SceneNode {
  @Inject('ScenesService') protected internalScenesService: InternalScenesService;
  @InjectFromExternalApi() protected scenesService: ScenesService;
  @Fallback() protected sceneNode: InternalSceneNode;
  protected scene: InternalScene;

  constructor(public sceneId: string, public nodeId: string) {
    this.scene = this.internalScenesService.getScene(sceneId);
    this.sceneNode = this.scene.getNode(this.nodeId);
  }

  /**
   * returns serialized representation on scene-node
   */
  getModel(): ISceneNode {
    return {
      id: this.sceneNode.id,
      sceneId: this.sceneNode.sceneId,
      sceneNodeType: this.sceneNode.sceneNodeType,
      parentId: this.sceneNode.parentId,
    };
  }

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

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
   * Detaches the node from its parent
   * After detaching the parent the current node will be a first-level-nesting node
   */
  detachParent(): void {
    return this.sceneNode.detachParent();
  }

  /**
   * Place the current node before the provided node
   * This method can change the parent of current node
   */
  placeBefore(nodeId: string): void {
    return this.sceneNode.placeBefore(nodeId);
  }
  /**
   * Place the current node after the provided node
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
   * To remove a folder without removing the nested nodes, use the `SceneItemFolder.ungroup()` method
   * @see SceneItemFolder.ungroup()
   */
  remove(): void {
    return this.sceneNode.remove();
  }

  /**
   * A shortcut for `SelectionService.isSelected(id)`
   */
  isSelected(): boolean {
    return this.isSelected();
  }

  /**
   * A shortcut for `SelectionService.select(id)`
   */
  select(): void {
    return this.sceneNode.select();
  }

  /**
   * A shortcut for `SelectionService.add(id)`
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
   * Returns the node path - the chain of all parent ids for the node
   */
  getPath(): string[] {
    return this.sceneNode.getPath();
  }
}
