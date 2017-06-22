import Vue from 'vue';
import { without } from 'lodash';
import { StatefulService, mutation, Inject } from '../stateful-service';
import Obs from '../../api/Obs';
import { ConfigFileService } from '../config-file';
import { SourcesService } from '../sources';
import { IScene, Scene } from './scene';
import electron from '../../vendor/electron';

const nodeObs: Dictionary<Function> = Obs.nodeObs;
const { ipcRenderer } = electron;

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

  @Inject()
  private configFileService: ConfigFileService;

  mounted() {
    this.sourcesService.sourceRemoved.subscribe(source => {
      this.removeSourceFromAllScenes(source.id);
    });
  }


  @mutation
  private RESET_SCENES() {
    this.state.activeSceneId = null;
    this.state.displayOrder = [];
    this.state.scenes = {};
  }

  @mutation
  private ADD_SCENE(id: string, name: string) {
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
  private REMOVE_SCENE(id: string) {
    Vue.delete(this.state.scenes, id);

    this.state.displayOrder = without(this.state.displayOrder, id);
  }

  @mutation
  private MAKE_SCENE_ACTIVE(id: string) {
    this.state.activeSceneId = id;
  }

  @mutation
  private SET_SCENE_ORDER(order: string[]) {
    this.state.displayOrder = order;
  }


  removeSourceFromAllScenes(sourceId: string) {
    this.scenes.forEach(scene => scene.removeSource(sourceId));
  }


  createScene(name: string) {
    // Get an id to identify the scene on the frontend
    const id = ipcRenderer.sendSync('getUniqueId');

    nodeObs.OBS_content_createScene(name);

    this.ADD_SCENE(id, name);
    this.addDefaultSources(id);
    this.makeSceneActive(id);

    this.configFileService.save();
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

    this.configFileService.save();
  }


  makeSceneActive(id: string) {
    const name = this.state.scenes[id].name;

    nodeObs.OBS_content_setCurrentScene(name);
    this.MAKE_SCENE_ACTIVE(id);
  }


  setSceneOrder(order: string[]) {
    this.SET_SCENE_ORDER(order);
  }


  loadSceneConfig() {
    this.sourcesService.reset();
    this.RESET_SCENES();

    const sceneNames: string[] = nodeObs.OBS_content_getListCurrentScenes();

    sceneNames.forEach(sceneName => {
      // Get an id to identify the scene on the frontend
      const id = ipcRenderer.sendSync('getUniqueId');

      this.ADD_SCENE(id, sceneName);
      this.getScene(id).loadConfig();
    });

    const needToCreateDefaultScene = Object.keys(this.state.scenes).length === 0;
    if (needToCreateDefaultScene) {
      this.createScene('Scene');
    }

  }


  // Utility functions / getters

  getSceneById(id: string): IScene {
    return this.getScene(id);
  }


  getSceneByName(name: string): IScene {
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
    scene.addSource('Mic/Aux', 'Audio Input Capture', true);
    scene.addSource('Desktop Audio', 'Audio Output Capture', true);
  }

}

