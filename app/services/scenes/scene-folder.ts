import { ScenesService, Scene } from './index';
import { merge, uniq } from 'lodash';
import { mutation, ServiceHelper } from '../stateful-service';
import Utils from '../utils';
import { Inject } from 'util/injector';
import { Selection, SelectionService } from 'services/selection';
import {
  ISceneFolderApi,
  ISceneNode,
  TSceneNodeType,
  SceneItem,
  ISceneHierarchy,
  TSceneNode
} from 'services/scenes';


import { SceneNode } from './scene-node';
import { ISceneFolder } from './scenes-api';

@ServiceHelper()
export class SceneFolder extends SceneNode implements ISceneFolderApi {

  // ISceneNode attributes
  nodeType: TSceneNodeType;
  id: string;
  parentId: string;
  childrenIds: string[];

  name: string;

  private sceneFolderState: ISceneNode;
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
    this.sceneFolderState = state;
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
    return this.getNodes().filter(node => node.nodeType === 'item') as SceneItem[];
  }

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

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
        children: node.nodeType === 'folder' ?
          (node as SceneFolder).getHierarchy() :
          []
      };
    });
  }

  getNestedNodes(): TSceneNode[] {
    const nodes: TSceneNode[] = [];
    this.getNodes().forEach(node => {
      nodes.push(node);
      if (node.nodeType !== 'folder') return;
      nodes.push(...((node as SceneFolder).getNestedNodes()));
    });
    return nodes;
  }

  getNestedItems(): SceneItem[] {
    return this.getNestedNodes()
      .filter(node => node.nodeType === 'item') as SceneItem[];
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

  getModel() {
    return this.sceneFolderState;
  }

  protected getState() {
    return this.sceneFolderState;
  }

  @mutation()
  private UPDATE(patch: TPatch<ISceneFolder>) {
    merge(this.sceneFolderState, patch);
  }

}
