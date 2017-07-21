import { times } from 'lodash';
import { Mutator, mutation } from '../stateful-service';
import { ScenesService } from './scenes';
import { SourcesService, TSourceType } from '../sources';
import { ISceneSource, SceneSource } from './scene-source';
import { ConfigFileService } from '../config-file';
import Utils from '../utils';
import { nodeObs } from '../obs-api';

export interface IScene {
  id: string;
  name: string;
  activeSourceId: string;
  sources: ISceneSource[];
}


@Mutator()
export class Scene implements IScene {
  id: string;
  name: string;
  activeSourceId: string;
  sources: ISceneSource[];

  private scenesService: ScenesService = ScenesService.instance;
  private sourcesService: SourcesService = SourcesService.instance;
  private configFileService: ConfigFileService = ConfigFileService.instance;
  private sceneState: IScene;

  constructor(sceneId: string) {
    this.sceneState = this.scenesService.state.scenes[sceneId];
    Utils.applyProxy(this, this.sceneState);
  }


  getSource(sourceId: string): SceneSource {
    return this.sceneState.sources.find(source => source.id === sourceId) ?
      new SceneSource(this.id, sourceId) :
      null;
  }


  getSources(options = { showHidden: false }): SceneSource[] {
    const sources = this.sceneState.sources.map(sourceModel => {
      return this.getSource(sourceModel.id);
    });

    return options.showHidden ? sources : sources.filter(source => !source.isHidden);
  }


  get inactiveSources(): SceneSource[] {
    return this.sceneState.sources.filter(sourceModel => {
      return sourceModel.id !== this.activeSourceId;
    }).map(source => {
      return this.getSource(source.id);
    });
  }


  get activeSource(): SceneSource {
    return this.getSource(this.activeSourceId);
  }


  loadConfig() {
    const sourceNames: string[] = nodeObs.OBS_content_getListCurrentSourcesFromScene(this.name);

    sourceNames.forEach(sourceName => {
      // Node-obs does not currently provide us with the
      // type at this point.  Luckily, we don't really
      // care about type on the frontend yet.
      const sourceId = SourcesService.instance.initSource(sourceName);

      this.ADD_SOURCE_TO_SCENE(sourceId);

      this.getSource(sourceId).loadAttributes();
    });
  }

  /**
   * Create and add the source to the current scene
   */
  addSource(
    sourceName: string,
    type: TSourceType,
    isHidden = false
  ): string {
    const sourceId = this.sourcesService.createSceneSource(this.id, this.name, sourceName, type, isHidden);
    this.ADD_SOURCE_TO_SCENE(sourceId);

    // Newly added sources are immediately active
    this.makeSourceActive(sourceId);

    this.configFileService.save();
    return sourceId;
  }

  removeSource(sourceId: string) {
    this.REMOVE_SOURCE_FROM_SCENE(sourceId);
  }


  makeSourceActive(sourceId: string) {
    if (sourceId) {
      const source = this.getSource(sourceId);

      // This should really operate on a scene too, rather than
      // just the currently active scene
      nodeObs.OBS_content_selectSources([{ name: source.name }]);
    } else {
      nodeObs.OBS_content_selectSources([]);
    }

    this.MAKE_SOURCE_ACTIVE(sourceId);
  }


  setSourceOrder(sourceId: string, positionDelta: number, order: string[]) {
    let operation: 'move_down' | 'move_up';

    if (positionDelta > 0) {
      operation = 'move_down';
    } else {
      operation = 'move_up';
    }

    const source = this.getSource(sourceId);

    times(Math.abs(positionDelta), () => {
      // This should operate on a specific scene rather
      // than just the active scene.
      nodeObs.OBS_content_setSourceOrder(source.name, operation);
    });

    const hiddenSourcesOrder = this.getSources({ showHidden: true })
      .filter(source => source.isHidden)
      .map(source => source.id);

    order.unshift(...hiddenSourcesOrder);

    this.SET_SOURCE_ORDER(order);
  }

  @mutation()
  private MAKE_SOURCE_ACTIVE(sourceId: string) {
    this.sceneState.activeSourceId = sourceId;
  }

  @mutation()
  private ADD_SOURCE_TO_SCENE(sourceId: string) {
    this.sceneState.sources.unshift({
      // This is information that belongs to a scene/source pair

      // The id of the source
      id: sourceId,

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
  private REMOVE_SOURCE_FROM_SCENE(sourceId: string) {

    if (this.sceneState.activeSourceId === sourceId) {
      this.sceneState.activeSourceId = null;
    }

    this.sceneState.sources = this.sceneState.sources.filter(source => {
      return source.id !== sourceId;
    });
  }

  @mutation()
  private SET_SOURCE_ORDER(order: string[]) {

    // TODO: This is O(n^2)
    this.sceneState.sources = order.map(id => {
      return this.sceneState.sources.find(source => {
        return source.id === id;
      });
    });
  }

}
