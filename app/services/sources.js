import Vue from 'vue';
import {
  inputValuesToObsValues,
  obsValuesToInputValues
} from '../components/shared/forms/Input.ts';

import { StatefulService, mutation } from './stateful-service';
import Obs from '../api/Obs';
import ScenesService from './scenes';
import configFileManager from '../util/ConfigFileManager';

const nodeObs = Obs.nodeObs;

const { ipcRenderer } = window.require('electron');

export default class SourcesService extends StatefulService {

  static initialState = {
    sources: {}
  };

  @mutation
  RESET_SOURCES() {
    this.state.sources = {};
  }

  @mutation
  ADD_SOURCE(id, name, type, properties) {
    Vue.set(this.state.sources, id, {
      id,
      name,
      type,
      properties,

      // Whether the source has audio and/or video
      // Will be updated periodically
      audio: false,
      video: false,

      // Unscaled width and height
      width: 0,
      height: 0,

      muted: false
    });
  }

  @mutation
  REMOVE_SOURCE(id) {
    Vue.delete(this.state.sources, id);
  }

  @mutation
  SET_SOURCE_PROPERTIES(id, properties) {
    this.state.sources[id].properties = properties;
  }

  @mutation
  SET_SOURCE_SIZE(id, width, height) {
    this.state.sources[id].width = width;
    this.state.sources[id].height = height;
  }

  @mutation
  SET_SOURCE_FLAGS(id, audio, video) {
    this.state.sources[id].audio = audio;
    this.state.sources[id].video = video;
  }

  @mutation
  SET_MUTED(id, muted) {
    this.state.sources[id].muted = muted;
  }

  // This is currently a single function because node-obs
  // does not support adding the same source to multiple
  // scenes.  This will be split into multiple functions
  // in the future.
  createSourceAndAddToScene(sceneId, name, type) {
    const sceneName = ScenesService.instance.getSceneById(sceneId).name;

    nodeObs.OBS_content_addSource(
      type,
      name,
      {},
      {},
      sceneName
    );

    const id = this.initSource(name, type);

    ScenesService.instance.addSourceToScene(sceneId, id);

    configFileManager.save();

    return id;
  }

  // Initializes a source and assigns it an id.
  // The id is returned.
  initSource(name, type) {
    // Get an id to identify the source on the frontend
    const id = ipcRenderer.sendSync('getUniqueId');
    const properties = this.getPropertiesFormData(id);

    this.ADD_SOURCE(id, name, type, properties);

    const muted = nodeObs.OBS_content_isSourceMuted(name);
    this.SET_MUTED(id, muted);

    return id;
  }


  removeSource(id) {
    const source = this.state.sources[id];

    nodeObs.OBS_content_removeSource(source.name);

    this.REMOVE_SOURCE(id);
    ScenesService.instance.removeSourceFromAllScenes(id);
  }


  refreshProperties(id) {
    const properties = this.getPropertiesFormData(id);

    this.SET_SOURCE_PROPERTIES(id, properties);
  }


  refreshSourceAttributes() {
    Object.keys(this.state.sources).forEach(id => {
      const source = this.state.sources[id];

      const size = nodeObs.OBS_content_getSourceSize(source.name);

      if ((source.width !== size.width) || (source.height !== size.height)) {
        this.SET_SOURCE_SIZE(id, size.width, size.height);
      }

      const flags = nodeObs.OBS_content_getSourceFlags(source.name);
      const audio = !!flags.audio;
      const video = !!flags.video;

      if ((source.audio !== audio) || (source.video !== video)) {
        this.SET_SOURCE_FLAGS(id, audio, video);
      }
    });
  }


  setProperties(sourceId, properties) {
    const source = this.state.sources[sourceId];
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true,
      intToString: true,
      valueToObject: true
    });

    for (const prop of propertiesToSave) {
      nodeObs.OBS_content_setProperty(
        source.name,
        prop.name,
        prop.value
      );
    }

    this.refreshProperties(sourceId);
    configFileManager.save();
  }


  setMuted(id, muted) {
    const source = this.state.sources[id];

    nodeObs.OBS_content_sourceSetMuted(source.name, muted);
    this.SET_MUTED(id, muted);
  }


  reset() {
    this.RESET_SOURCES();
  }

  // Utility functions / getters

  getSourceById(id) {
    return this.state.sources[id];
  }


  getSourceByName(name) {
    return Object.values(this.state.sources).find(source => {
      return source.name === name;
    });
  }


  get sources() {
    return Object.values(this.state.sources);
  }


  getPropertiesFormData(sourceId) {
    const source = this.getSourceById(sourceId);
    if (!source) return [];

    const obsProps = nodeObs.OBS_content_getSourceProperties(source.name);
    const props = obsValuesToInputValues(obsProps, {
      boolIsString: true,
      valueIsObject: true,
      valueGetter: (propName) => {
        return nodeObs.OBS_content_getSourcePropertyCurrentValue(
          source.name,
          propName
        );
      },
      subParametersGetter: (propName) => {
        return nodeObs.OBS_content_getSourcePropertiesSubParameters(source.name, propName);
      }
    });

    // some magic required by node-obs
    nodeObs.OBS_content_updateSourceProperties(source.name);

    return props;
  }

}

