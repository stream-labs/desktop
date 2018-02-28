/**
 * abstract class for representing scene's folders and items
 */
import { ServiceHelper, mutation } from '../stateful-service';
import { TSceneNodeType } from './scenes-api';
import { Inject } from '../../util/injector';
import { ScenesService, Scene, ISceneNode, SceneFolder, SceneItem } from './index';
import { SelectionService } from 'services/selection';

@ServiceHelper()
export abstract class SceneNode implements ISceneNode {

  id: string;
  parentId: string;
  childrenIds: string[];
  nodeType: TSceneNodeType;

  protected sceneId: string;

  @Inject() protected scenesService: ScenesService;
  @Inject() protected selectionService: SelectionService;

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  setParent(parentId: string) {
    this.placeAfter(parentId);
    this.SET_PARENT(parentId);
  }

  detachParent() {
    this.SET_PARENT(null);
  }

  getParent(): SceneFolder {
    return this.getScene().getFolder(this.parentId);
  }

  hasParent(): boolean {
    return !!this.getState().parentId;
  }

  getNodeIndex(): number {
    return this.getScene().getNodesIds().indexOf(this.id);
  }

  placeAfter(nodeId: string) {
    this.getScene().placeAfter(this.id, nodeId);
  }

  placeBefore(nodeId: string) {
    this.getScene().placeBefore(this.id, nodeId);
  }

  getPrevNode() {
    const nodeInd = this.getNodeIndex();
    return this.getScene().getNodes()[nodeInd - 1];
  }

  getNextNode() {
    const nodeInd = this.getNodeIndex();
    return this.getScene().getNodes()[nodeInd + 1];
  }

  isSelected() {
    return this.selectionService.isSelected(this.id);
  }

  select() {
    this.selectionService.select(this.id);
  }

  addToSelection() {
    this.selectionService.add(this.id);
  }

  deselect() {
    this.selectionService.deselect(this.id);
  }

  isFolder(): this is SceneFolder {
    return this.nodeType === 'folder';
  }

  isItem(): this is SceneItem {
    return this.nodeType === 'item';
  }

  protected abstract getState(): ISceneNode;
  protected abstract remove(): void;


  @mutation()
  protected SET_PARENT(parentId?: string) {
    const state = this.getState();
    const currentParent = this.getScene().getFolder(state.parentId);
    if (currentParent) {
      const childInd = currentParent.childrenIds.indexOf(this.id);
      currentParent.childrenIds.splice(childInd, 1);
    }
    state.parentId = parentId;
    if (!parentId) return;
    const newParent = this.getScene().getFolder(parentId);
    newParent.childrenIds.unshift(this.id);
  }

}
