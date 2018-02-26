import { ServiceHelper, mutation } from '../stateful-service';
import { ScenesService } from './scenes';
import { Source, SourcesService, TSourceType } from '../sources';
import {
  ISceneItem,
  SceneItem,
  IScene,
  ISceneApi,
  ISceneItemAddOptions,
  ISceneItemInfo,
  ISceneFolder,
  SceneFolder,
  ISceneNode
} from './index';
import Utils from '../utils';
import * as obs from '../obs-api';
import electron from 'electron';
import { Inject } from '../../util/injector';
import { SelectionService, Selection, TNodesList } from 'services/selection';
import { uniqBy } from 'lodash';
const { ipcRenderer } = electron;


export type TSceneNode = SceneItem | SceneFolder;

export interface ISceneHierarchy extends ISceneNode {
  children: ISceneHierarchy[];
}

@ServiceHelper()
export class Scene implements ISceneApi {
  id: string;
  name: string;
  nodes: (ISceneItem | ISceneFolder)[];

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private selectionService: SelectionService;

  private sceneState: IScene;

  constructor(sceneId: string) {
    this.sceneState = this.scenesService.state.scenes[sceneId];
    Utils.applyProxy(this, this.sceneState);
  }

  // getter for backward compatibility with previous version of API
  get items(): ISceneItem[] {
    return this.nodes.filter(node => node.nodeType === 'item') as ISceneItem[];
  }

  getModel(): IScene {
    return this.sceneState;
  }

  getObsScene(): obs.IScene {
    return obs.SceneFactory.fromName(this.id);
  }

  getNode(sceneNodeId: string): TSceneNode {
    const nodeModel = this.sceneState.nodes
      .find(sceneItemModel => sceneItemModel.id === sceneNodeId) as ISceneItem;

    if (!nodeModel) return null;

    return nodeModel.nodeType === 'item' ?
      new SceneItem(this.id, nodeModel.id, nodeModel.sourceId) :
      new SceneFolder(this.id, nodeModel.id);
  }

  getItem(sceneItemId: string): SceneItem {
    const node = this.getNode(sceneItemId);
    return (node && node.nodeType === 'item') ? node as SceneItem : null;
  }

  getFolder(sceneFolderId: string): SceneFolder {
    const node = this.getNode(sceneFolderId);
    return (node && node.nodeType === 'folder') ? node as SceneFolder : null;
  }

  getItems(): SceneItem[] {
    return this.sceneState.nodes
      .filter(node => node.nodeType === 'item')
      .map(item => this.getItem(item.id));
  }

  getFolders(): SceneFolder[] {
    return this.sceneState.nodes
      .filter(node => node.nodeType === 'folder')
      .map(item => this.getFolder(item.id));
  }

  getNodes(): TSceneNode[] {
    return (this.sceneState.nodes
      .map(node => {
        return node.nodeType === 'folder' ?
          this.getFolder(node.id) :
          this.getItem(node.id);
      }));
  }

  getRootNodes(): TSceneNode[] {
    return this.getNodes().filter(node => !node.parentId);
  }

  getNodesIds(): string[] {
    return this.sceneState.nodes.map(item => item.id);
  }

  getSelection(itemsList?: TNodesList): Selection {
    return new Selection(this.id, itemsList);
  }

  setName(newName: string) {
    const sceneSource = this.sourcesService.getSource(this.id);
    sceneSource.setName(newName);
    this.SET_NAME(newName);
  }

  createAndAddSource(sourceName: string, type: TSourceType, settings?: Dictionary<any>): SceneItem {
    const source = this.sourcesService.createSource(sourceName, type, settings);
    return this.addSource(source.sourceId);
  }


  addSource(sourceId: string, options: ISceneItemAddOptions = {}): SceneItem {

    const source = this.sourcesService.getSource(sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    if (!this.canAddSource(sourceId)) return null;


    const sceneItemId = options.sceneItemId || ipcRenderer.sendSync('getUniqueId');

    let obsSceneItem: obs.ISceneItem;
    obsSceneItem = this.getObsScene().add(source.getObsInput());

    this.ADD_SOURCE_TO_SCENE(
      sceneItemId,
      source.sourceId,
      obsSceneItem.id,
      options.parentId || ''
    );
    const sceneItem = this.getItem(sceneItemId);

    sceneItem.loadAttributes();

    // Newly added sources are immediately active
    this.selectionService.select(sceneItemId);

    this.scenesService.itemAdded.next(sceneItem.sceneItemState);
    return sceneItem;
  }

  createFolder(name: string) {

    const id = ipcRenderer.sendSync('getUniqueId');

    this.ADD_FOLDER_TO_SCENE({
      id,
      name,
      nodeType: 'folder',
      parentId: '',
      childrenIds: []
    });
    return this.getFolder(id);
  }

  removeFolder(folderId: string) {
    const sceneFolder = this.getFolder(folderId);
    if (!sceneFolder) {
      console.error(`SceneFolder ${folderId} not found`);
      return;
    }
    sceneFolder.getSelection().remove();
    sceneFolder.detachParent();
    this.REMOVE_NODE_FROM_SCENE(folderId);
  }

  remove(force?: boolean): IScene {
    return this.scenesService.removeScene(this.id, force);
  }


  removeItem(sceneItemId: string) {
    const sceneItem = this.getItem(sceneItemId);
    if (!sceneItem) {
      console.error(`SceneItem ${sceneItemId} not found`);
      return;
    }
    sceneItem.detachParent();
    sceneItem.getObsSceneItem().remove();
    this.REMOVE_NODE_FROM_SCENE(sceneItemId);
    this.scenesService.itemRemoved.next(sceneItem.sceneItemState);
  }


  setLockOnAllItems(locked: boolean) {
    this.getItems().forEach(item => item.setSettings({ locked }));
  }


  placeAfter(sourceNodeId: string, destNodeId?: string) {

    const sourceNode = this.getNode(sourceNodeId);
    const destNode = this.getNode(destNodeId);


    const itemsToMove: SceneItem[] = sourceNode.isFolder() ? sourceNode.getNestedItems() : [sourceNode];
    const firstItemIndex = itemsToMove[0].getItemIndex();
    const newItemIndex = destNode ? destNode.getItemIndex() : 0;
    const obsScene = this.getObsScene();

    // move obs items
    if (newItemIndex !== firstItemIndex) {
      for (let i = 0; i < itemsToMove.length; i++) {
        if (newItemIndex > firstItemIndex) {
          obsScene.moveItem(firstItemIndex, newItemIndex);
        } else {
          obsScene.moveItem(firstItemIndex + i, newItemIndex);
        }
      }
    }

    // move nodes
    const sceneNodesIds = this.getNodesIds();
    const nodesToMoveIds: string[] = sourceNode.nodeType === 'folder' ?
      [sourceNode.id].concat((sourceNode as SceneFolder).getNestedNodesIds()) :
      [sourceNode.id];
    const firstNodeIndex = this.getNode(nodesToMoveIds[0]).getNodeIndex();
    const newNodeIndex = destNode ? destNode.getNodeIndex() : 0;

    sceneNodesIds.splice(firstNodeIndex, nodesToMoveIds.length);
    sceneNodesIds.splice(newNodeIndex, 0, ...nodesToMoveIds);

    this.SET_NODES_ORDER(sceneNodesIds);
  }

  placeBefore(sourceNodeId: string, destNodeId: string) {
    const destNode = this.getNode(destNodeId).getPrevNode();
    this.placeAfter(sourceNodeId, destNode && destNode.id);
  }


  addSources(items: ISceneItemInfo[]) {
    const arrayItems: (ISceneItemInfo & obs.ISceneItemInfo)[] = [];

    items.forEach(item => {
      const source = this.sourcesService.getSource(item.sourceId);
      if (source) {
        arrayItems.push({
          name: source.sourceId,
          id: item.id,
          sourceId: source.sourceId,
          crop: item.crop,
          scaleX: item.scaleX == null ? 1 : item.scaleX,
          scaleY: item.scaleY == null ? 1 : item.scaleY,
          visible: item.visible,
          x: item.x == null ? 0 : item.x,
          y: item.y == null ? 0 : item.y,
          locked: item.locked,
          rotation: item.rotation || 0
        });
      }
    });

    const sceneItems = obs.addItems(this.getObsScene(), arrayItems);

    arrayItems.forEach((sceneItem, index) => {
      this.ADD_SOURCE_TO_SCENE(items[index].id, items[index].sourceId, sceneItems[index].id);
      this.getItem(items[index].id).loadItemAttributes(sceneItem);
    });
  }


  canAddSource(sourceId: string): boolean {
    const source = this.sourcesService.getSource(sourceId);
    if (!source) return false;

    // if source is scene then traverse the scenes tree to detect possible infinity scenes loop
    if (source.type !== 'scene') return true;
    if (this.id === source.sourceId) return false;

    const sceneToAdd = this.scenesService.getScene(source.sourceId);
    return !sceneToAdd.hasNestedScene(this.id);
  }


  hasNestedScene(sceneId: string) {
    const childScenes = this.getItems()
      .filter(sceneItem => sceneItem.type === 'scene')
      .map(sceneItem => this.scenesService.getScene(sceneItem.sourceId));

    for (const childScene of childScenes) {
      if (childScene.id === sceneId) return true;
      if (childScene.hasNestedScene(sceneId)) return true;
    }

    return false;
  }


  /**
   * returns scene items of scene + scene items of nested scenes
   */
  getNestedItems(options = { excludeScenes: false }): SceneItem[] {
    let result = this.getItems();
    result
      .filter(sceneItem => sceneItem.type === 'scene')
      .map(sceneItem => {
        return this.scenesService.getScene(sceneItem.sourceId).getNestedItems();
      }).forEach(sceneItems => {
        result = result.concat(sceneItems);
      });
    if (options.excludeScenes) result = result.filter(sceneItem => sceneItem.type !== 'scene');
    return uniqBy(result, 'sceneItemId');
  }


  makeActive() {
    this.scenesService.makeSceneActive(this.id);
  }


  /**
   * returns sources of scene + sources of nested scenes
   * result also includes nested scenes
   */
  getNestedSources(options = { excludeScenes: false }): Source[] {
    const sources = this.getNestedItems(options).map(sceneItem => sceneItem.getSource());
    return uniqBy(sources, 'sourceId');
  }

  @mutation()
  private SET_NAME(newName: string) {
    this.sceneState.name = newName;
  }

  @mutation()
  private ADD_SOURCE_TO_SCENE(
    sceneItemId: string,
    sourceId: string,
    obsSceneItemId: number,
    parentId = ''
  ) {
    this.sceneState.nodes.unshift({
      // This is information that belongs to a scene/source pair

      // The id of the source
      sceneItemId,
      sourceId,
      obsSceneItemId,
      parentId,
      id: sceneItemId,
      nodeType: 'item',

      transform: {
        // Position in video space
        position: { x: 0, y: 0 },

        // Scale between 0 and 1
        scale: { x: 1.0, y: 1.0 },

        crop: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },

        rotation: 0,

      },

      visible: true,
      locked: false
    });
  }

  @mutation()
  private ADD_FOLDER_TO_SCENE(folderModel: ISceneFolder) {
    this.sceneState.nodes.unshift(folderModel);
  }


  @mutation()
  private REMOVE_NODE_FROM_SCENE(nodeId: string) {

    if (this.selectionService.isSelected(nodeId)) {
      this.selectionService.deselect(nodeId);
    }

    this.sceneState.nodes = this.sceneState.nodes.filter(item => {
      return item.id !== nodeId;
    });
  }

  @mutation()
  private SET_NODES_ORDER(order: string[]) {

    // TODO: This is O(n^2)
    this.sceneState.nodes = order.map(id => {
      return this.sceneState.nodes.find(item => {
        return item.id === id;
      });
    });
  }

}
