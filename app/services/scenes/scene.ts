import { Mutator, mutation } from '../stateful-service';
import { ScenesService } from './scenes';
import { SourcesService, TSourceType } from '../sources';
import { ISceneItem, SceneItem } from './scene-item';
import { ConfigPersistenceService } from '../config-persistence';
import Utils from '../utils';
import { ObsScene, ObsSceneItem } from '../obs-api';
import electron from '../../vendor/electron';

const { ipcRenderer } = electron;


export interface IScene {
  id: string;
  name: string;
  activeItemId: string;
  items: ISceneItem[];
}

// TODO: delete these options after we will handle the config loading on the frontend side
export interface ISceneItemAddOptions {
  sceneItemId?: string; // A new ID will be assigned if one is not provided
}


@Mutator()
export class Scene implements IScene {
  id: string;
  name: string;
  activeItemId: string;
  items: ISceneItem[];

  private scenesService: ScenesService = ScenesService.instance;
  private sourcesService: SourcesService = SourcesService.instance;
  private configPersistenceService: ConfigPersistenceService = ConfigPersistenceService.instance;
  private sceneState: IScene;

  constructor(sceneId: string) {
    this.sceneState = this.scenesService.state.scenes[sceneId];
    Utils.applyProxy(this, this.sceneState);
  }


  getObsScene(): ObsScene {
    return ObsScene.fromName(this.name);
  }


  getItem(sceneItemId: string): SceneItem {
    const sceneItemModel = this.sceneState.items.find(sceneItemModel => sceneItemModel.sceneItemId === sceneItemId);
    return sceneItemModel ?
      new SceneItem(this.id, sceneItemModel.sceneItemId, sceneItemModel.sourceId) :
      null;
  }


  getItems(options = { showHidden: false }): SceneItem[] {
    const sources = this.sceneState.items.map(sourceModel => {
      return this.getItem(sourceModel.sceneItemId);
    });

    return options.showHidden ? sources : sources.filter(source => !source.isHidden);
  }


  get inactiveSources(): SceneItem[] {
    return this.sceneState.items.filter(sourceModel => {
      return sourceModel.sceneItemId !== this.activeItemId;
    }).map(source => {
      return this.getItem(source.sceneItemId);
    });
  }


  get activeItem(): SceneItem {
    return this.getItem(this.activeItemId);
  }


  createAndAddSource(sourceName: string, type: TSourceType): SceneItem {
    const source = this.sourcesService.createSource(sourceName, type);
    return this.addSource(source.sourceId);
  }


  addSource(sourceId: string, options: ISceneItemAddOptions = {}): SceneItem {
    const source = this.sourcesService.getSource(sourceId);
    const sceneItemId = options.sceneItemId || ipcRenderer.sendSync('getUniqueId');

    let obsSceneItem: ObsSceneItem;
    obsSceneItem = this.getObsScene().add(source.getObsInput());

    this.ADD_SOURCE_TO_SCENE(sceneItemId, source.sourceId, obsSceneItem.id);
    const sceneItem = this.getItem(sceneItemId);

    // Newly added sources are immediately active
    this.makeItemActive(sceneItemId);

    sceneItem.loadAttributes();

    this.configPersistenceService.save();
    this.scenesService.sourceAdded.next(sceneItem.sceneItemState);
    return sceneItem;
  }


  removeItem(sceneItemId: string) {
    const sceneItem = this.getItem(sceneItemId);
    sceneItem.getObsSceneItem().remove();
    this.REMOVE_SOURCE_FROM_SCENE(sceneItemId);
    this.scenesService.sourceRemoved.next(sceneItem.sceneItemState);
  }


  makeItemActive(sceneItemId: string) {
    const selectedItem = this.getItem(sceneItemId);
    this.getObsScene().getItems().forEach(obsSceneItem => {
      if (!selectedItem || selectedItem.obsSceneItemId !== obsSceneItem.id) {
        obsSceneItem.selected = false;
        return;
      }
      obsSceneItem.selected = true;
    });

    this.MAKE_SOURCE_ACTIVE(sceneItemId);
  }


  setSourceOrder(sceneItemId: string, positionDelta: number, order: string[]) {
    const itemIndex = this.getItemIndex(sceneItemId);
    const hiddenSourcesOrder = this.getItems({ showHidden: true })
      .filter(item => item.isHidden)
      .map(item => item.sceneItemId);

    order.unshift(...hiddenSourcesOrder);

    this.getObsScene().moveItem(itemIndex, itemIndex + positionDelta);
    this.SET_SOURCE_ORDER(order);
  }


  getItemIndex(sceneItemId: string): number {
    return this.sceneState.items.findIndex(sceneItemModel => sceneItemModel.sceneItemId === sceneItemId);
  }


  @mutation()
  private MAKE_SOURCE_ACTIVE(sceneItemId: string) {
    this.sceneState.activeItemId = sceneItemId;
  }

  @mutation()
  private ADD_SOURCE_TO_SCENE(sceneItemId: string, sourceId: string, obsSceneItemId: number) {
    this.sceneState.items.unshift({
      // This is information that belongs to a scene/source pair

      // The id of the source
      sceneItemId,
      sourceId,
      obsSceneItemId,

      // Position in video space
      x: 0,
      y: 0,

      // Scale between 0 and 1
      scaleX: 1.0,
      scaleY: 1.0,

      visible: true,

      crop: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    });
  }

  @mutation()
  private REMOVE_SOURCE_FROM_SCENE(sceneItemId: string) {

    if (this.sceneState.activeItemId === sceneItemId) {
      this.sceneState.activeItemId = null;
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
