import Vue from 'vue';
import _ from 'lodash';

import { StatefulService, mutation } from './stateful-service';
import Obs from '../api/Obs';
import configFileManager from '../util/ConfigFileManager';
import SourcesService from './sources';
import store from '../store';
import { ScalableRectangle } from '../util/ScalableRectangle.ts';

const nodeObs = Obs.nodeObs;
const { ipcRenderer } = window.require('electron');

export default class ScenesService extends StatefulService {

  static initialState = {
    activeSceneId: null,
    displayOrder: [],
    scenes: {}
  };


  @mutation
  RESET_SCENES() {
    this.state.activeSceneId = null;
    this.state.displayOrder = [];
    this.state.scenes = {};
  }

  @mutation
  ADD_SCENE(id, name) {
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
  REMOVE_SCENE(id) {
    Vue.delete(this.state.scenes, id);

    this.state.displayOrder = _.without(this.state.displayOrder, id);
  }

  @mutation
  MAKE_SCENE_ACTIVE(id) {
    this.state.activeSceneId = id;
  }

  @mutation
  SET_SCENE_ORDER(order) {
    this.state.displayOrder = order;
  }

  @mutation
  ADD_SOURCE_TO_SCENE(sceneId, sourceId) {
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
  REMOVE_SOURCE_FROM_SCENE(sceneId, sourceId) {
    const scene = this.state.scenes[sceneId];

    if (scene.activeSourceId === sourceId) {
      scene.activeSourceId = null;
    }

    scene.sources = scene.sources.filter(source => {
      return source.id !== sourceId;
    });
  }

  @mutation
  MAKE_SOURCE_ACTIVE(sceneId, sourceId) {
    this.state.scenes[sceneId].activeSourceId = sourceId;
  }

  @mutation
  SET_SOURCE_ORDER(id, order) {
    const scene = this.state.scenes[id];

    // TODO: This is O(n^2)
    scene.sources = order.map(id => {
      return scene.sources.find(source => {
        return source.id === id;
      });
    });
  }

  @mutation
  SET_SOURCE_POSITION(sceneId, sourceId, x, y) {
    const source = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    source.x = x;
    source.y = y;
  }

  @mutation
  SET_SOURCE_SCALE(sceneId, sourceId, scaleX, scaleY) {
    const source = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    source.scaleX = scaleX;
    source.scaleY = scaleY;
  }

  @mutation
  SET_SOURCE_VISIBILITY(sceneId, sourceId, visible) {
    const source = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    source.visible = visible;
  }

  // Adds the existing source to the current scene
  addSourceToScene(sceneId, sourceId) {
    // TODO: When node-obs supports associating and existing
    // source with a scene, we should do that here.

    this.ADD_SOURCE_TO_SCENE(sceneId, sourceId);

    // Newly added sources are immediately active
    this.makeSourceActive(sceneId, sourceId);
  }

  removeSourceFromAllScenes(sourceId) {
    Object.keys(this.state.scenes).forEach(sceneId => {
      this.REMOVE_SOURCE_FROM_SCENE(sceneId, sourceId);
    });
  }

  createScene(name) {
    // Get an id to identify the scene on the frontend
    const id = ipcRenderer.sendSync('getUniqueId');

    nodeObs.OBS_content_createScene(name);

    this.ADD_SCENE(id, name);
    this.makeSceneActive(id);

    configFileManager.save();
  }

  removeScene(id) {
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

  makeSceneActive(id) {
    const name = this.state.scenes[id].name;

    nodeObs.OBS_content_setCurrentScene(name);
    this.MAKE_SCENE_ACTIVE(id);
  }

  setSceneOrder(order) {
    this.SET_SCENE_ORDER(order);
  }

  makeSourceActive(sceneId, sourceId) {
    if (sourceId) {
      const source = this.getMergedSource(sceneId, sourceId);

      // This should really operate on a scene too, rather than
      // just the currently active scene
      nodeObs.OBS_content_selectSources([{ name: source.name }]);
    } else {
      nodeObs.OBS_content_selectSources([]);
    }

    this.MAKE_SOURCE_ACTIVE(sceneId, sourceId);
  }

  setSourceOrder(sceneId, sourceId, positionDelta, order) {
    let operation;

    if (positionDelta > 0) {
      operation = 'move_down';
    } else {
      operation = 'move_up';
    }

    const source = this.getMergedSource(sceneId, sourceId);

    _.times(Math.abs(positionDelta), () => {
      // This should operate on a specific scene rather
      // than just the active scene.
      nodeObs.OBS_content_setSourceOrder(source.name, operation);
    });

    this.SET_SOURCE_ORDER(sceneId, order);
  }

  setSourcePosition(sceneId, sourceId, x, y) {
    const scene = this.getSceneById(sceneId);
    const source = this.getMergedSource(sceneId, sourceId);

    nodeObs.OBS_content_setSourcePosition(scene.name, source.name, x.toString(), y.toString());
    this.SET_SOURCE_POSITION(sceneId, sourceId, x, y);
  }

  setSourcePositionAndScale(sceneId, sourceId, x, y, scaleX, scaleY) {
    const scene = this.getSceneById(sceneId);
    const source = this.getMergedSource(sceneId, sourceId);

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

  resetSourceTransform(sceneId, sourceId) {
    this.setSourcePositionAndScale(
      sceneId,
      sourceId,
      0,
      0,
      1.0,
      1.0
    );
  }

  flipSourceVertical(sceneId, sourceId) {
    const source = this.getMergedSource(sceneId, sourceId);
    const rect = new ScalableRectangle(source);

    rect.flipY();

    this.setSourcePositionAndScale(
      sceneId,
      sourceId,
      rect.x,
      rect.y,
      rect.scaleX,
      rect.scaleY
    );
  }

  flipSourceHorizontal(sceneId, sourceId) {
    const source = this.getMergedSource(sceneId, sourceId);
    const rect = new ScalableRectangle(source);

    rect.flipX();

    this.setSourcePositionAndScale(
      sceneId,
      sourceId,
      rect.x,
      rect.y,
      rect.scaleX,
      rect.scaleY
    );
  }

  loadSceneConfig() {
    SourcesService.instance.reset();
    this.RESET_SCENES();

    const sceneNames = nodeObs.OBS_content_getListCurrentScenes();

    sceneNames.forEach(sceneName => {
      // Get an id to identify the scene on the frontend
      const id = ipcRenderer.sendSync('getUniqueId');

      this.ADD_SCENE(id, sceneName);

      const sourceNames = nodeObs.OBS_content_getListCurrentSourcesFromScene(sceneName);

      sourceNames.forEach(sourceName => {
        // Node-obs does not currently provide us with the
        // type at this point.  Luckily, we don't really
        // care about type on the frontend yet.
        const sourceId = SourcesService.instance.initSource(sourceName);

        this.ADD_SOURCE_TO_SCENE(id, sourceId);

        this.loadSourceAttributes(id, sourceId);
      });
    });

    // TODO: LOAD EXISTING SCENE TRANSITIONS
    store.dispatch({ type: 'refreshSceneTransitions' });
  }

  loadSourceAttributes(sceneId, sourceId) {
    const scene = this.getSceneById(sceneId);
    const source = this.getMergedSource(sceneId, sourceId);

    const position = nodeObs.OBS_content_getSourcePosition(scene.name, source.name);
    const scale = nodeObs.OBS_content_getSourceScaling(scene.name, source.name);

    this.SET_SOURCE_POSITION(sceneId, sourceId, position.x, position.y);
    this.SET_SOURCE_SCALE(sceneId, sourceId, scale.x, scale.y);

    const visible = nodeObs.OBS_content_getSourceVisibility(scene.name, source.name);
    this.SET_SOURCE_VISIBILITY(sceneId, sourceId, visible);
  }

  setSourceVisibility(sceneId, sourceId, visible) {
    const scene = this.getSceneById(sceneId);
    const source = this.getMergedSource(sceneId, sourceId);

    nodeObs.OBS_content_setSourceVisibility(scene.name, source.name, visible);
    this.SET_SOURCE_VISIBILITY(sceneId, sourceId, visible);
  }

  // Utility functions / getters

  getSceneById(id) {
    return this.state.scenes[id];
  }

  getSceneByName(name) {
    let foundScene = null;

    Object.keys(this.state.scenes).forEach(id => {
      const scene = this.state.scenes[id];

      if (scene.name === name) {
        foundScene = scene;
      }
    });

    return foundScene;
  }

  get scenes() {
    return this.state.displayOrder.map(id => {
      return this.state.scenes[id];
    });
  }

  // A merged source is a source that contains
  // all of the information about that source, and
  // how it fits in to the given scene
  getMergedSource(sceneId, sourceId) {
    const source = SourcesService.instance.getSourceById(sourceId);
    const sceneSource = this.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });

    // Using a proxy will ensure that this object
    // is always up-to-date, and essentially acts
    // as a view into the store.  It also enforces
    // the read-only nature of this data
    return new Proxy({}, {
      get(target, key) {
        if (source.hasOwnProperty(key)) {
          return source[key];
        }

        if (sceneSource.hasOwnProperty(key)) {
          return sceneSource[key];
        }

        // Some computed attributes
        if (key === 'scaledWidth') {
          return source.width * sceneSource.scaleX;
        }

        if (key === 'scaledHeight') {
          return source.height * sceneSource.scaleY;
        }

        return undefined;
      }
    });
  }

  get activeSceneId() {
    return this.state.activeSceneId;
  }

  get activeScene() {
    return this.state.scenes[this.state.activeSceneId];
  }

  get sources() {
    if (this.activeScene) {
      return this.activeScene.sources.map(source => {
        return this.getMergedSource(this.activeScene.id, source.id);
      });
    }

    return [];
  }

  get activeSourceId() {
    if (this.activeScene) {
      return this.activeScene.activeSourceId;
    }

    return null;
  }

  get activeSource() {
    if (this.activeScene) {
      if (this.activeScene.activeSourceId) {
        return this.getMergedSource(
          this.activeScene.id,
          this.activeScene.activeSourceId
        );
      }
    }

    return null;
  }

  get inactiveSources() {
    if (this.activeScene) {
      return this.activeScene.sources.filter(source => {
        return source.id !== this.activeScene.activeSourceId;
      }).map(source => {
        return this.getMergedSource(
          this.activeScene.id,
          source.id
        );
      });
    }

    return [];
  }



}
