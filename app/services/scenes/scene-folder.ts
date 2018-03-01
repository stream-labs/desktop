import { ScenesService, Scene } from './index';
import { merge, uniq } from 'lodash';
import { mutation, ServiceHelper } from '../stateful-service';
import Utils from '../utils';
import { Inject } from 'util/injector';
import { Selection, SelectionService } from 'services/selection';
import {
  ISceneItemFolderApi,
  ISceneItemNode,
  TSceneNodeType,
  SceneItem,
  ISceneHierarchy,
  TSceneNode
} from 'services/scenes';


import { SceneItemNode } from './scene-node';
import { ISceneItemFolder } from './scenes-api';

@ServiceHelper()
export class SceneItemFolder extends SceneItemNode implements ISceneItemFolderApi {

  // ISceneNode attributes
  sceneNodeType: TSceneNodeType;
  id: string;
  parentId: string;
  childrenIds: string[];

  name: string;

  private sceneFolderState: ISceneItemFolder;
  protected sceneId: string;

  @Inject() protected scenesService: ScenesService;
  @Inject() protected selectionService: SelectionService;

  constructor(sceneId: string, id: string) {

    super();

    this.sceneId = sceneId;
    this.id = id;

    const state = this.scenesService.state.scenes[sceneId].nodes.find(item => {
      return item.id === id;
    });

    Utils.applyProxy(this, state);
    this.sceneFolderState = state as ISceneItemFolder;
  }

  add(sceneNodeId: string) {
    this.getScene().getNode(sceneNodeId).setParent(this.id);
  }

  ungroup() {
    this.getItems().forEach(item => item.detachParent());
    this.remove();
  }

  getSelection(): Selection {
    return this.getScene().getSelection(this.childrenIds);
  }


  getNodes(): TSceneNode[] {
    const scene = this.getScene();
    return this.childrenIds.map(nodeId => scene.getNode(nodeId));
  }

  getItems(): SceneItem[] {
    return this.getNodes().filter(node => node.sceneNodeType === 'item') as SceneItem[];
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
        children: node.sceneNodeType === 'folder' ?
          (node as SceneItemFolder).getHierarchy() :
          []
      };
    });
  }

  getNestedNodes(): TSceneNode[] {
    const nodes: TSceneNode[] = [];
    this.getNodes().forEach(node => {
      nodes.push(node);
      if (node.sceneNodeType !== 'folder') return;
      nodes.push(...((node as SceneItemFolder).getNestedNodes()));
    });
    return nodes;
  }

  getNestedItems(): SceneItem[] {
    return this.getNestedNodes()
      .filter(node => node.sceneNodeType === 'item') as SceneItem[];
  }

  getNestedNodesIds(): string[] {
    return this.getNestedNodes().map(node => node.id);
  }

  getNestedItemsIds(): string[] {
    return this.getNestedItems().map(item => item.id);
  }

  setName(name: string) {
    this.UPDATE({ id: this.id, name });
  }

  remove() {
    this.getScene().removeFolder(this.id);
  }

  getModel(): ISceneItemFolder {
    return this.sceneFolderState;
  }

  protected getState() {
    return this.sceneFolderState;
  }

  @mutation()
  private UPDATE(patch: TPatch<ISceneItemFolder>) {
    merge(this.sceneFolderState, patch);
  }

}
