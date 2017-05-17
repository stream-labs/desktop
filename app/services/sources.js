import Vue from 'vue';
import _ from 'lodash';

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
      height: 0
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
    const properties = this.fetchPropertiesForSource(name, id);

    this.ADD_SOURCE(id, name, type, properties);

    return id;
  }

  removeSource(id) {
    const source = this.state.sources[id];

    nodeObs.OBS_content_removeSource(source.name);

    this.REMOVE_SOURCE(id);
    ScenesService.instance.removeSourceFromAllScenes(id);
  }

  refreshProperties(id) {
    const source = this.state.sources[id];
    const properties = this.fetchPropertiesForSource(source.name, id);

    this.SET_SOURCE_PROPERTIES(id, properties);
  }

  setProperty(property, value) {
    const source = this.state.sources[property.sourceId];

    nodeObs.OBS_content_setProperty(
      source.name,
      property.name,
      value
    );

    this.refreshProperties(property.sourceId);
    configFileManager.save();
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


  // Dealing with OBS API Junk

  fetchPropertiesForSource(name, id) {
    const properties = nodeObs.OBS_content_getSourceProperties(name);

    const parsedProperties = properties.map(prop => {
      const propertyObj = {
        sourceId: id,
        name: prop.name,
        description: prop.description,
        longDescription: prop.long_description,
        type: prop.type,
        visible: (prop.visible === 'true'),
        enabled: (prop.enabled === 'true')
      };

      // For list types, we must separately fetch the
      // list options.
      if (propertyObj.type === 'OBS_PROPERTY_LIST') {
        propertyObj.options = _.compact(nodeObs
          .OBS_content_getSourcePropertiesSubParameters(name, propertyObj.name));
      }

      propertyObj.value = this.getPropertyValue(name, propertyObj);

      return propertyObj;
    });

    nodeObs.OBS_content_updateSourceProperties(name);

    return parsedProperties;
  }

  getPropertyValue(name, property) {
    const obj = nodeObs.OBS_content_getSourcePropertyCurrentValue(
      name,
      property.name
    );

    // All of these values come back as strings for now, so
    // we need to do some basic type coersion.

    if (property.type === 'OBS_PROPERTY_BOOL') {
      obj.value = obj.value === 'true';
    }

    if (property.type === 'OBS_PROPERTY_FLOAT') {
      obj.value = parseFloat(obj.value);
    }

    if (property.type === 'OBS_PROPERTY_INT') {
      obj.value = parseInt(obj.value);
    }

    if (property.type === 'OBS_PROPERTY_FRAME_RATE') {
      obj.numerator = parseInt(obj.numerator);
      obj.denominator = parseInt(obj.denominator);

      obj.ranges.forEach(range => {
        range.max.numerator = parseInt(range.max.numerator);
        range.max.denominator = parseInt(range.max.denominator);
        range.min.numerator = parseInt(range.min.numerator);
        range.min.denominator = parseInt(range.min.denominator);
      });
    }

    if (property.type === 'OBS_PROPERTY_FONT') {
      obj.style = obj.style || 'Regular';
    }

    if (property.type === 'OBS_PROPERTY_PATH') {
      obj.filter = SourcesService.parsePathFilters(obj.filter);
    }

    if (property.type === 'OBS_PROPERTY_EDITABLE_LIST') {
      obj.filter = SourcesService.parsePathFilters(obj.filter);
    }

    return obj;
  }

  // TODO: move this function outside the file
  static parsePathFilters(filterStr) {
    const filters = _.compact(filterStr.split(';;'));

    // Browser source uses *.*
    if (filterStr === '*.*') {
      return [
        {
          name: 'All Files',
          extensions: ['*']
        }
      ];
    }

    return filters.map(filter => {
      const match = filter.match(/^(.*) \((.*)\)$/);
      const desc = match[1];
      let types = match[2].split(' ');

      types = types.map(type => {
        return type.match(/^\*\.(.+)$/)[1];
      });

      // This is the format that electron file dialogs use
      return {
        name: desc,
        extensions: types
      };
    });
  }


}

