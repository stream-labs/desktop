import { ScenesService, Scene } from './index';
import { merge } from 'lodash';
import { mutation, ServiceHelper } from '../stateful-service';
import Utils from '../utils';
import { Inject } from 'util/injector';
import { Selection, SelectionService } from 'services/selection';
import { ISceneItemFolderApi, SceneItem, ISceneHierarchy, TSceneNode } from 'services/scenes';

import { SceneItemNode } from './scene-node';
import { ISceneItemFolder } from './scenes-api';

@ServiceHelper()
export class SceneItemFolder extends SceneItemNode implements ISceneItemFolderApi {
  name: string;

  private readonly sceneFolderState: ISceneItemFolder;

  @Inject() protected scenesService: ScenesService;
  @Inject() protected selectionService: SelectionService;

  constructor(sceneId: string, id: string) {
    super();

    this.id = id;

    const state = this.scenesService.state.scenes[sceneId].nodes.find(item => {
      return item.id === id;
    });

    Utils.applyProxy(this, state);
    this.sceneFolderState = state as ISceneItemFolder;
  }

  add(sceneNodeId: string) {
    this.getScene()
      .getNode(sceneNodeId)
      .setParent(this.id);
  }

  ungroup() {
    this.getItems().forEach(item => item.setParent(this.parentId));
    this.remove();
  }

  getSelection(): Selection {
    return this.getScene().getSelection(this.childrenIds);
  }

  /**
   * returns only child nodes
   * use getNestedNodes() to get the all nested nodes
   */
  getNodes(): TSceneNode[] {
    const scene = this.getScene();
    return this.childrenIds.map(nodeId => scene.getNode(nodeId));
  }

  getItems(): SceneItem[] {
    return this.getNodes().filter(node => node.sceneNodeType === 'item') as SceneItem[];
  }

  getFolders(): SceneItemFolder[] {
    return this.getNodes().filter(node => node.sceneNodeType === 'folder') as SceneItemFolder[];
  }

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  /**
   * itemIndex for SceneFolder is itemIndex of previous SceneItem
   *
   * nodeInd | itemInd | nodes tree
   *  0      |    0    | Folder1
   *  1      |    0    |   |_Folder2
   *  2      |    0    |   |_ Item1
   *  3      |    1    |   \_ Item2
   *  4      |    2    | Item3
   *  5      |    2    | Folder3
   *  6      |    3    |   |_Item4
   *  7      |    4    |   \_Item5
   *
   */
  getItemIndex(): number {
    const nodeInd = this.getNodeIndex();
    if (nodeInd === 0) return 0;
    return this.getPrevNode().getItemIndex();
  }

  getHierarchy(): ISceneHierarchy[] {
    const nodes = this.getNodes();
    return nodes.map(node => {
      return {
        ...node.getModel(),
        children: node.sceneNodeType === 'folder' ? (node as SceneItemFolder).getHierarchy() : [],
      };
    });
  }

  getNestedNodes(traversedNodesIds: string[] = []): TSceneNode[] {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    traversedNodesIds = [].concat(traversedNodesIds);
    const nodes: TSceneNode[] = [];
    this.getNodes().forEach(node => {
      if (traversedNodesIds.includes(node.id)) {
        // TODO: find the use-case that causes loops in folders structure
        console.error(`Loop in folders structure detected', ${this.name} -> ${node.name}`);
        return;
      }
      nodes.push(node);
      traversedNodesIds.push(node.id);
      if (node.sceneNodeType !== 'folder') return;
      nodes.push(...(node as SceneItemFolder).getNestedNodes(traversedNodesIds));
    });
    return nodes;
  }

  getNestedItems(): SceneItem[] {
    return this.getNestedNodes().filter(node => node.sceneNodeType === 'item') as SceneItem[];
  }

  getNestedFolders(): SceneItemFolder[] {
    return this.getNestedNodes().filter(
      node => node.sceneNodeType === 'folder',
    ) as SceneItemFolder[];
  }

  getNestedNodesIds(): string[] {
    return this.getNestedNodes().map(node => node.id);
  }

  getNestedItemsIds(): string[] {
    return this.getNestedItems().map(item => item.id);
  }

  getNestedFoldersIds(): string[] {
    return this.getNestedFolders().map(folder => folder.id);
  }

  setName(name: string) {
    this.UPDATE({ name, id: this.id });
  }

  remove() {
    this.getScene().removeFolder(this.id);
  }

  getModel(): ISceneItemFolder {
    return this.sceneFolderState;
  }

  /**
   * for internal usage only
   */
  recalculateChildrenOrder() {
    this.sceneFolderState.childrenIds = this.childrenIds;
    const childrenCount = this.childrenIds.length;
    const nodeInd = this.getNodeIndex();
    const foundChildren: TSceneNode[] = [];
    const sceneNodes = this.getScene().getNodes();

    for (let i = nodeInd + 1; foundChildren.length < childrenCount; i++) {
      const sceneNode = sceneNodes[i];
      if (sceneNode.parentId === this.id) foundChildren.push(sceneNode);
    }

    this.SET_CHILDREN_ORDER(foundChildren.map(child => child.id));
  }

  protected get state() {
    return this.sceneFolderState;
  }

  @mutation()
  private UPDATE(patch: TPatch<ISceneItemFolder>) {
    merge(this.sceneFolderState, patch);
  }

  @mutation()
  private SET_CHILDREN_ORDER(childrenIds: string[]) {
    this.sceneFolderState.childrenIds = childrenIds;
  }
}
