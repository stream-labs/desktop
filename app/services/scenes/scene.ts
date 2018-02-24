import { ServiceHelper, mutation } from '../stateful-service';
import { ScenesService } from './scenes';
import { Source, SourcesService, TSourceType } from '../sources';
import {
  ISceneItem,
  SceneItem,
  IScene,
  ISceneApi,
  ISceneItemAddOptions,
  ISceneItemInfo
} from './index';
import Utils from '../utils';
import * as obs from '../obs-api';
import electron from 'electron';
import { Inject } from '../../util/injector';
import { SelectionService, Selection } from 'services/selection';
import { uniqBy } from 'lodash';

const { ipcRenderer } = electron;


@ServiceHelper()
export class Scene implements ISceneApi {
  id: string;
  name: string;
  items: ISceneItem[];

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private selectionService: SelectionService;

  private sceneState: IScene;

  constructor(sceneId: string) {
    this.sceneState = this.scenesService.state.scenes[sceneId];
    Utils.applyProxy(this, this.sceneState);
  }

  getModel(): IScene {
    return this.sceneState;
  }

  getObsScene(): obs.IScene {
    return obs.SceneFactory.fromName(this.id);
  }


  getItem(sceneItemId: string): SceneItem {
    const sceneItemModel = this.sceneState.items.find(sceneItemModel => sceneItemModel.sceneItemId === sceneItemId);
    return sceneItemModel ?
      new SceneItem(this.id, sceneItemModel.sceneItemId, sceneItemModel.sourceId) :
      null;
  }


  getItems(): SceneItem[] {
    return this.sceneState.items.map(sourceModel => {
      return this.getItem(sourceModel.sceneItemId);
    });
  }

  getItemIds(): string[] {
    return this.sceneState.items.map(item => item.sceneItemId);
  }

  getSelection(itemsIds?: string[]): Selection {
    return new Selection(this.id, itemsIds);
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

    this.ADD_SOURCE_TO_SCENE(sceneItemId, source.sourceId, obsSceneItem.id);
    const sceneItem = this.getItem(sceneItemId);

    sceneItem.loadAttributes();

    // Newly added sources are immediately active
    this.selectionService.select(sceneItemId);

    this.scenesService.itemAdded.next(sceneItem.sceneItemState);
    return sceneItem;
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

    sceneItem.getObsSceneItem().remove();
    this.REMOVE_SOURCE_FROM_SCENE(sceneItemId);
    this.scenesService.itemRemoved.next(sceneItem.sceneItemState);
  }


  setLockOnAllItems(locked: boolean) {
    this.getItems().forEach(item => item.setSettings({ locked }));
  }


  setSourceOrder(sceneItemId: string, positionDelta: number, order: string[]) {
    const itemIndex = this.getItemIndex(sceneItemId);
    this.getObsScene().moveItem(itemIndex, itemIndex + positionDelta);
    this.SET_SOURCE_ORDER(order);
  }


  getItemIndex(sceneItemId: string): number {
    return this.sceneState.items.findIndex(sceneItemModel => sceneItemModel.sceneItemId === sceneItemId);
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
  private ADD_SOURCE_TO_SCENE(sceneItemId: string, sourceId: string, obsSceneItemId: number) {
    this.sceneState.items.unshift({
      // This is information that belongs to a scene/source pair

      // The id of the source
      sceneItemId,
      sourceId,
      obsSceneItemId,

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
  private REMOVE_SOURCE_FROM_SCENE(sceneItemId: string) {

    if (this.selectionService.isSelected(sceneItemId)) {
      this.selectionService.deselect(sceneItemId);
    }

    this.sceneState.items = this.sceneState.items.filter(source => {
      return source.sceneItemId !== sceneItemId;
    });
  }

  @mutation()
  private SET_SOURCE_ORDER(order: string[]) {

    // TODO: This is O(n^2)
    this.sceneState.items = order.map(id => {
      return this.sceneState.items.find(source => {
        return source.sceneItemId === id;
      });
    });
  }

}
