import Vue from 'vue';
import { without } from 'lodash';
import { StatefulService, mutation, Inject } from '../stateful-service';
import { nodeObs, ObsScene, ESceneDupType } from '../obs-api';
import { ScenesTransitionsService } from '../scenes-transitions';
import { SourcesService } from '../sources';
import { IScene, Scene, ISceneItem } from '../scenes';
import electron from '../../vendor/electron';
import { Subject } from 'rxjs/Subject';

const { ipcRenderer } = electron;

interface IScenesState {
  activeSceneId: string;
  displayOrder: string[];
  scenes: Dictionary<IScene>;
}

interface ISceneCreateOptions {
  duplicateSourcesFromScene?: string;
  sceneId?: string; // A new ID will be generated if one is not provided
  addDefaultSources?: boolean;
  makeActive?: boolean;
}

export class ScenesService extends StatefulService<IScenesState> {

  static initialState: IScenesState = {
    activeSceneId: '',
    displayOrder: [],
    scenes: {}
  };

  sourceAdded = new Subject<ISceneItem>();
  sourceRemoved = new Subject<ISceneItem>();

  @Inject()
  private sourcesService: SourcesService;

  @Inject()
  private transitionsService: ScenesTransitionsService;


  @mutation()
  private RESET_SCENES() {
    this.state.activeSceneId = null;
    this.state.displayOrder = [];
    this.state.scenes = {};
  }

  @mutation()
  private ADD_SCENE(id: string, name: string) {
    Vue.set<IScene>(this.state.scenes, id, {
      id,
      name,
      activeItemId: null,
      items: []
    });
    this.state.displayOrder.push(id);
    this.state.activeSceneId = this.state.activeSceneId || id;
  }

  @mutation()
  private REMOVE_SCENE(id: string) {
    Vue.delete(this.state.scenes, id);

    this.state.displayOrder = without(this.state.displayOrder, id);
  }

  @mutation()
  private MAKE_SCENE_ACTIVE(id: string) {
    this.state.activeSceneId = id;
  }

  @mutation()
  private SET_SCENE_ORDER(order: string[]) {
    this.state.displayOrder = order;
  }


  createScene(name: string, options: ISceneCreateOptions = {}) {
    // Get an id to identify the scene on the frontend
    const id = options.sceneId || ipcRenderer.sendSync('getUniqueId');
    this.ADD_SCENE(id, name);
    ObsScene.create(name);

    if (!options.duplicateSourcesFromScene) {
      if (options.addDefaultSources) this.addDefaultSources(id);
    } else {
      const oldScene = this.getSceneByName(options.duplicateSourcesFromScene);
      const newScene = this.getScene(id);

      oldScene.getItems().slice().reverse().forEach(item => {
        const newItem = newScene.addSource(item.sourceId);
        newItem.setPositionAndScale(
          item.x,
          item.y,
          item.scaleX,
          item.scaleY
        );
        newItem.setVisibility(item.visible);
        newItem.setCrop(item.crop);
      });
    }

    if (options.makeActive) this.makeSceneActive(id);

    // API for now can't save the scenes order
    const scenesNames = this.scenes.map(scene => scene.name);
    nodeObs.OBS_content_fillTabScenes(scenesNames);

    return this.getSceneByName(name);
  }


  removeScene(id: string) {
    if (Object.keys(this.state.scenes).length < 2) {
      alert('There needs to be at least one scene.');
      return;
    }

    const scene = this.getScene(id);

    // remove all sources from scene
    scene.getItems({ showHidden: true }).forEach(sceneItem => scene.removeItem(sceneItem.sceneItemId));

    scene.getObsScene().release();

    this.REMOVE_SCENE(id);

    // OBS_content_getListCurrentScenes relies on OBS_content_fillTabScenes
    // so we have to delete the scene from this list
    const scenesNames = this.scenes.map(scene => scene.name);
    nodeObs.OBS_content_fillTabScenes(scenesNames);

    if (this.state.activeSceneId === id) {
      const sceneIds = Object.keys(this.state.scenes);

      if (sceneIds[0]) {
        this.makeSceneActive(sceneIds[0]);
      }
    }
  }


  getSourceScenes(sourceId: string): Scene[] {
    const resultScenes: Scene[] = [];
    this.scenes.forEach(scene => {
      const items = scene.getItems({ showHidden: true }).filter(sceneItem => sceneItem.sourceId === sourceId);
      if (items.length > 0) resultScenes.push(scene);
    });
    return resultScenes;
  }


  makeSceneActive(id: string) {
    const scene = this.getScene(id).getObsScene();

    this.transitionsService.transitionTo(scene);
    this.MAKE_SCENE_ACTIVE(id);
  }


  setSceneOrder(order: string[]) {
    this.SET_SCENE_ORDER(order);
  }


  // Utility functions / getters

  getSceneById(id: string): IScene {
    return this.getScene(id);
  }


  getSceneByName(name: string): Scene {
    let foundScene: IScene;

    Object.keys(this.state.scenes).forEach(id => {
      const scene = this.state.scenes[id];

      if (scene.name === name) {
        foundScene = scene;
      }
    });

    return foundScene ? this.getScene(foundScene.id) : null;
  }


  getScene(id: string) {
    return !this.state.scenes[id] ? null : new Scene(id);
  }


  get scenes(): Scene[] {
    return this.state.displayOrder.map(id => {
      return this.getScene(id);
    });
  }


  get activeSceneId(): string {
    return this.state.activeSceneId;
  }


  get activeScene(): Scene {
    return this.getScene(this.state.activeSceneId);
  }


  private addDefaultSources(sceneId: string) {
    const scene = this.getScene(sceneId);

    const audioInputSource = this.sourcesService.createSource(
      'Mic/Aux', 'wasapi_input_capture', { isHidden: true }
    );

    const audioOutputSource = this.sourcesService.createSource(
      'Desktop Audio', 'wasapi_output_capture', { isHidden: true }
    );

    scene.addSource(audioInputSource.sourceId);
    scene.addSource(audioOutputSource.sourceId);
  }

}

