import Vue from 'vue';
import { without } from 'lodash';
import { StatefulService, mutation } from '../stateful-service';
import * as obs from '../../../obs-api';
import { ScenesTransitionsService } from '../scenes-transitions';
import { SourcesService } from '../sources';
import { IScene, Scene, ISceneItem, ISceneApi } from '../scenes';
import electron from '../../vendor/electron';
import { Subject } from 'rxjs/Subject';
import { Inject } from '../../util/injector';
import { shortcut } from '../shortcuts';

const { ipcRenderer } = electron;

interface IScenesState {
  activeSceneId: string;
  displayOrder: string[];
  scenes: Dictionary<IScene>;
}

interface ISceneCreateOptions {
  duplicateSourcesFromScene?: string;
  sceneId?: string; // A new ID will be generated if one is not provided
  makeActive?: boolean;
}


export interface IScenesServiceApi {
  createScene(name: string, options: ISceneCreateOptions): ISceneApi;
  scenes: ISceneApi[];
  activeScene: ISceneApi;
  activeSceneId: string;
  getSceneByName(name: string): ISceneApi;
}


export class ScenesService extends StatefulService<IScenesState> implements IScenesServiceApi {

  static initialState: IScenesState = {
    activeSceneId: '',
    displayOrder: [],
    scenes: {}
  };

  sceneAdded = new Subject<IScene>();
  sceneRemoved= new Subject<IScene>();
  itemAdded = new Subject<ISceneItem>();
  itemRemoved = new Subject<ISceneItem>();

  @Inject()
  private sourcesService: SourcesService;


  @Inject('ScenesTransitionsService')
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
    const scene = obs.SceneFactory.create(name);

    if (options.duplicateSourcesFromScene) {
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
    this.sceneAdded.next(this.state.scenes[id]);
    return this.getSceneByName(name);
  }


  removeScene(id: string, force = false): IScene {
    if (!force && Object.keys(this.state.scenes).length < 2) {
      alert('There needs to be at least one scene.');
      return;
    }

    const scene = this.getScene(id);
    const sceneModel = this.state.scenes[id];

    // remove all sources from scene
    scene.getItems().forEach(sceneItem => scene.removeItem(sceneItem.sceneItemId));

    scene.getObsScene().release();

    this.REMOVE_SCENE(id);

    if (this.state.activeSceneId === id) {
      const sceneIds = Object.keys(this.state.scenes);

      if (sceneIds[0]) {
        this.makeSceneActive(sceneIds[0]);
      }
    }
    this.sceneRemoved.next(sceneModel);
    return sceneModel;
  }


  getSourceScenes(sourceId: string): Scene[] {
    const resultScenes: Scene[] = [];
    this.scenes.forEach(scene => {
      const items = scene.getItems().filter(sceneItem => sceneItem.sourceId === sourceId);
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


  getSceneItem(sceneItemId: string) {
    for (const scene of this.scenes) {
      const sceneItem = scene.getItem(sceneItemId);
      if (sceneItem) return sceneItem;
    }
    return null;
  }

  @shortcut('ArrowLeft')
  nudgeActiveItemLeft() {
    if (this.activeScene.activeItem) {
      this.activeScene.activeItem.nudgeLeft();
    }
  }


  @shortcut('ArrowRight')
  nudgeActiveItemRight() {
    if (this.activeScene.activeItem) {
      this.activeScene.activeItem.nudgeRight();
    }
  }


  @shortcut('ArrowUp')
  nudgeActiveItemUp() {
    if (this.activeScene.activeItem) {
      this.activeScene.activeItem.nudgeUp();
    }
  }


  @shortcut('ArrowDown')
  nudgeActiveItemDown() {
    if (this.activeScene.activeItem) {
      this.activeScene.activeItem.nudgeDown();
    }
  }


  @shortcut('Delete')
  removeActiveItem() {
    if (this.activeScene.activeItem) {
      this.activeScene.removeItem(this.activeScene.activeItem.sceneItemId);
    }
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

}

