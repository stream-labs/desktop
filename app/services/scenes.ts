import Vue from 'vue';
import { without, times } from 'lodash';
import { StatefulService, mutation, Inject } from './stateful-service';
import Obs from '../api/Obs';
import configFileManager from '../util/ConfigFileManager';
import { Source, SourcesService, TSourceType } from './sources';
import electron from '../vendor/electron';
import Utils from './utils';

const nodeObs: Dictionary<Function> = Obs.nodeObs;
const { ipcRenderer } = electron;

export interface IScene {
  id: string;
  name: string;
  activeSourceId: string;
  sources: ISceneSource[];
}

export interface ISceneSource {
  id: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
}

interface IScenesState {
  activeSceneId: string;
  displayOrder: string[];
  scenes: Dictionary<IScene>;
}

export class ScenesService extends StatefulService<IScenesState> {

  static initialState: IScenesState = {
    activeSceneId: '',
    displayOrder: [],
    scenes: {}
  };

  @Inject()
  private sourcesService: SourcesService;

  mounted() {
    this.sourcesService.sourceRemoved.subscribe(source => {
      this.removeSourceFromAllScenes(source.id);
    });
  }


  @mutation
  RESET_SCENES() {
    this.state.activeSceneId = null;
    this.state.displayOrder = [];
    this.state.scenes = {};
  }

  @mutation
  ADD_SCENE(id: string, name: string) {
    Vue.set(this.state.scenes, id, {
      id,
      name,
      activeSourceId: null,
      sources: []
    });

    this.state.displayOrder.push(id);

    this.state.activeSceneId = this.state.activeSceneId || id;
  }

  @mutation
  REMOVE_SCENE(id: string) {
    Vue.delete(this.state.scenes, id);

    this.state.displayOrder = without(this.state.displayOrder, id);
  }

  @mutation
  MAKE_SCENE_ACTIVE(id: string) {
    this.state.activeSceneId = id;
  }

  @mutation
  SET_SCENE_ORDER(order: string[]) {
    this.state.displayOrder = order;
  }

  @mutation
  ADD_SOURCE_TO_SCENE(sceneId: string, sourceId: string) {
    this.state.scenes[sceneId].sources.unshift({
      // This is information that belongs to a scene/source pair

      // The id of the source
      id: sourceId,

      // Position in video space
      x: 0,
      y: 0,

      // Scale between 0 and 1
      scaleX: 1.0,
      scaleY: 1.0,

      visible: true
    });
  }

  @mutation
  REMOVE_SOURCE_FROM_SCENE(sceneId: string, sourceId: string) {
    const scene = this.state.scenes[sceneId];

    if (scene.activeSourceId === sourceId) {
      scene.activeSourceId = null;
    }

    scene.sources = scene.sources.filter(source => {
      return source.id !== sourceId;
    });
  }

  @mutation
  MAKE_SOURCE_ACTIVE(sceneId: string, sourceId: string) {
    this.state.scenes[sceneId].activeSourceId = sourceId;
  }

  @mutation
  SET_SOURCE_ORDER(id: string, order: string[]) {
    const scene = this.state.scenes[id];

    // TODO: This is O(n^2)
    scene.sources = order.map(id => {
      return scene.sources.find(source => {
        return source.id === id;
      });
    });
  }

  @mutation
  SET_SOURCE_POSITION(sceneId: string, sourceId: string, x: number, y: number) {
    const source = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    source.x = x;
    source.y = y;
  }

  @mutation
  SET_SOURCE_SCALE(sceneId: string, sourceId: string, scaleX: number, scaleY: number) {
    const source = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    source.scaleX = scaleX;
    source.scaleY = scaleY;
  }

  @mutation
  SET_SOURCE_VISIBILITY(sceneId: string, sourceId: string, visible: boolean) {
    const source = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    source.visible = visible;
  }


  /**
   * Create and add the source to the current scene
   */
  createSourceAndAddToScene(
    sceneId: string,
    sourceName: string,
    type: TSourceType,
    isHidden = false
  ): string {
    const sceneName = this.getSceneById(sceneId).name;
    const sourceId = this.sourcesService.createSceneSource(sceneId, sceneName, sourceName, type, isHidden);
    this.ADD_SOURCE_TO_SCENE(sceneId, sourceId);

    // Newly added sources are immediately active
    this.makeSourceActive(sceneId, sourceId);

    configFileManager.save();
    return sourceId;
  }


  removeSourceFromAllScenes(sourceId: string) {
    Object.keys(this.state.scenes).forEach(sceneId => {
      this.REMOVE_SOURCE_FROM_SCENE(sceneId, sourceId);
    });
  }


  createScene(name: string) {
    // Get an id to identify the scene on the frontend
    const id = ipcRenderer.sendSync('getUniqueId');

    nodeObs.OBS_content_createScene(name);

    this.ADD_SCENE(id, name);
    this.addDefaultSources(id);
    this.makeSceneActive(id);

    configFileManager.save();
  }


  removeScene(id: string) {
    const name = this.state.scenes[id].name;

    nodeObs.OBS_content_removeScene(name);
    this.REMOVE_SCENE(id);

    if (this.state.activeSceneId === id) {
      const sceneIds = Object.keys(this.state.scenes);

      if (sceneIds[0]) {
        this.makeSceneActive(sceneIds[0]);
      }
    }

    configFileManager.save();
  }


  makeSceneActive(id: string) {
    const name = this.state.scenes[id].name;

    nodeObs.OBS_content_setCurrentScene(name);
    this.MAKE_SCENE_ACTIVE(id);
  }


  setSceneOrder(order: string[]) {
    this.SET_SCENE_ORDER(order);
  }


  makeSourceActive(sceneId: string, sourceId: string) {
    if (sourceId) {
      const source = this.getSource(sceneId, sourceId);

      // This should really operate on a scene too, rather than
      // just the currently active scene
      nodeObs.OBS_content_selectSources([{ name: source.name }]);
    } else {
      nodeObs.OBS_content_selectSources([]);
    }

    this.MAKE_SOURCE_ACTIVE(sceneId, sourceId);
  }


  setSourceOrder(sceneId: string, sourceId: string, positionDelta: number, order: string[]) {
    let operation: 'move_down' | 'move_up';

    if (positionDelta > 0) {
      operation = 'move_down';
    } else {
      operation = 'move_up';
    }

    const source = this.getSource(sceneId, sourceId);

    times(Math.abs(positionDelta), () => {
      // This should operate on a specific scene rather
      // than just the active scene.
      nodeObs.OBS_content_setSourceOrder(source.name, operation);
    });

    this.SET_SOURCE_ORDER(sceneId, order);
  }


  setSourcePosition(sceneId: string, sourceId: string, x: number, y: number) {
    const scene = this.getSceneById(sceneId);
    const source = this.getSource(sceneId, sourceId);

    nodeObs.OBS_content_setSourcePosition(scene.name, source.name, x.toString(), y.toString());
    this.SET_SOURCE_POSITION(sceneId, sourceId, x, y);
  }


  setSourcePositionAndScale(sceneId: string, sourceId: string, x: number, y: number, scaleX: number, scaleY: number) {
    const scene = this.getSceneById(sceneId);
    const source = this.getSource(sceneId, sourceId);

    // Uses a virtual node-obs function to set position and
    // scale atomically.  This is required for smooth resizing.
    nodeObs.OBS_content_setSourcePositionAndScale(
      scene.name,
      source.name,
      x.toString(),
      y.toString(),
      scaleX.toString(),
      scaleY.toString()
    );

    this.SET_SOURCE_POSITION(sceneId, sourceId, x, y);
    this.SET_SOURCE_SCALE(sceneId, sourceId, scaleX, scaleY);
  }


  loadSceneConfig() {
    SourcesService.instance.reset();
    this.RESET_SCENES();

    const sceneNames: string[] = nodeObs.OBS_content_getListCurrentScenes();

    sceneNames.forEach(sceneName => {
      // Get an id to identify the scene on the frontend
      const id = ipcRenderer.sendSync('getUniqueId');

      this.ADD_SCENE(id, sceneName);

      const sourceNames: string[] = nodeObs.OBS_content_getListCurrentSourcesFromScene(sceneName);

      sourceNames.forEach(sourceName => {
        // Node-obs does not currently provide us with the
        // type at this point.  Luckily, we don't really
        // care about type on the frontend yet.
        const sourceId = SourcesService.instance.initSource(sourceName);

        this.ADD_SOURCE_TO_SCENE(id, sourceId);

        this.loadSourceAttributes(id, sourceId);
      });
    });

    const needToCreateDefaultScene = Object.keys(this.state.scenes).length === 0;
    if (needToCreateDefaultScene) {
      this.createScene('Scene');
    }

  }


  loadSourceAttributes(sceneId: string, sourceId: string) {
    const scene = this.getSceneById(sceneId);
    const source = this.getSource(sceneId, sourceId);

    const position = nodeObs.OBS_content_getSourcePosition(scene.name, source.name);
    const scale = nodeObs.OBS_content_getSourceScaling(scene.name, source.name);

    this.SET_SOURCE_POSITION(sceneId, sourceId, position.x, position.y);
    this.SET_SOURCE_SCALE(sceneId, sourceId, scale.x, scale.y);

    const visible = nodeObs.OBS_content_getSourceVisibility(scene.name, source.name);
    this.SET_SOURCE_VISIBILITY(sceneId, sourceId, visible);
  }


  setSourceVisibility(sceneId: string, sourceId: string, visible: boolean) {
    const scene = this.getSceneById(sceneId);
    const source = this.getSource(sceneId, sourceId);

    nodeObs.OBS_content_setSourceVisibility(scene.name, source.name, visible);
    this.SET_SOURCE_VISIBILITY(sceneId, sourceId, visible);
  }


  // Utility functions / getters

  getSceneById(id: string): IScene {
    return this.state.scenes[id];
  }


  getSceneByName(name: string): IScene {
    let foundScene = null;

    Object.keys(this.state.scenes).forEach(id => {
      const scene = this.state.scenes[id];

      if (scene.name === name) {
        foundScene = scene;
      }
    });

    return foundScene;
  }


  get scenes(): IScene[] {
    return this.state.displayOrder.map(id => {
      return this.state.scenes[id];
    });
  }


  get activeSceneId(): string {
    return this.state.activeSceneId;
  }


  get activeScene(): IScene {
    return this.state.scenes[this.state.activeSceneId];
  }


  getSource(sceneId: string, sourceId: string): SceneSource {
    return new SceneSource(sourceId, sceneId);
  }

  getSources(options = { showHidden: false }): SceneSource[] {
    if (this.activeScene) {
      const sources = this.activeScene.sources.map(source => {
        return this.getSource(this.activeScene.id, source.id);
      });

      return options.showHidden ? sources : sources.filter(source => !source.isHidden);
    }

    return [];
  }

  get activeSourceId(): string {
    if (this.activeScene) {
      return this.activeScene.activeSourceId;
    }

    return null;
  }

  get activeSource(): SceneSource {
    if (this.activeScene) {
      if (this.activeScene.activeSourceId) {
        return this.getSource(
          this.activeScene.id,
          this.activeScene.activeSourceId
        );
      }
    }

    return null;
  }

  get inactiveSources(): SceneSource[] {
    if (this.activeScene) {
      return this.activeScene.sources.filter(source => {
        return source.id !== this.activeScene.activeSourceId;
      }).map(source => {
        return this.getSource(
          this.activeScene.id,
          source.id
        );
      });
    }

    return [];
  }

  private addDefaultSources(sceneId: string) {
    this.createSourceAndAddToScene(sceneId, 'Mic/Aux', 'Audio Input Capture', true);
    this.createSourceAndAddToScene(sceneId, 'Desktop Audio', 'Audio Output Capture', true);
  }
}

/**
 * A SceneSource is a source that contains
 * all of the information about that source, and
 * how it fits in to the given scene
 */
export class SceneSource extends Source implements ISceneSource {
  id: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;

  // Some computed attributes

  get scaledWidth(): number {
    return this.width * this.scaleX;
  }

  get scaledHeight(): number {
    return this.height * this.scaleY;
  }


  @Inject()
  private scenesService: ScenesService;


  constructor(sourceId: string, sceneId: string) {
    super(sourceId);
    const sceneSource = this.scenesService.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });
    Utils.applyProxy(this, sceneSource);
  }
}
