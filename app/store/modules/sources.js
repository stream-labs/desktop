import Vue from 'vue';
import Obs from '../../api/Obs.js';
import _ from 'lodash';
import configFileManager from '../../util/ConfigFileManager.js';

const state = {
  sources: {}
};

const mutations = {
  RESET_SOURCES(state) {
    state.sources = {};
  },

  ADD_SOURCE(state, data) {
    Vue.set(state.sources, data.id, {
      id: data.id,
      name: data.name,
      type: data.type,
      properties: data.properties,
      restorePoint: null,

      // Whether the source has audio and/or video
      audio: data.audio,
      video: data.video,

      // Unscaled width and height
      width: 0,
      height: 0,

      // Position in video space
      x: 0,
      y: 0,

      // Should be between 0 and 1
      scaleX: 1.0,
      scaleY: 1.0
    });
  },

  REMOVE_SOURCE(state, data) {
    Vue.delete(state.sources, data.sourceId);
  },

  SET_SOURCE_PROPERTIES(state, data) {
    let source = state.sources[data.sourceId];

    source.properties = data.properties;
  },

  CREATE_PROPERTIES_RESTORE_POINT(state, data) {
    let source = state.sources[data.sourceId];

    source.restorePoint = _.cloneDeep(source.properties);
  },

  SET_SOURCE_SIZE(state, data) {
    let source = state.sources[data.sourceId];

    source.width = data.width;
    source.height = data.height;
  },

  SET_SOURCE_POSITION(state, data) {
    let source = state.sources[data.sourceId];

    source.x = data.x;
    source.y = data.y;
  },

  SET_SOURCE_SCALE(state, data) {
    let source = state.sources[data.sourceId];

    source.scaleX = data.scaleX;
    source.scaleY = data.scaleY;
  }
};

const actions = {
  // node-obs does not currently support adding an existing
  // source to a scene. The state and mutations are set up
  // to support this in the future, but actions will match
  // the current capability of node-obs.
  createSourceAndAddToScene({ commit, dispatch }, data) {
    Obs.createSource(
      data.sceneName,
      data.sourceType,
      data.sourceName
    );

    const properties = Obs.sourceProperties(data.sourceName, data.sourceId);

    const flags = Obs.sourceProperties(data.sourceByName);

    commit('ADD_SOURCE', {
      id: data.sourceId,
      name: data.sourceName,
      type: data.sourceType,
      audio: !!flags.audio,
      video: !!flags.video,
      properties,
    });

    commit('ADD_SOURCE_TO_SCENE', {
      sourceId: data.sourceId,
      sceneName: data.sceneName
    });

    dispatch({
      type: 'makeSourceActive',
      sourceId: data.sourceId,
      sceneName: data.sceneName
    });

    configFileManager.save();
  },

  removeSource({ commit, state }, data) {
    let source = state.sources[data.sourceId];

    Obs.removeSource(source.name);

    commit('REMOVE_SOURCE', {
      sourceId: data.sourceId
    });

    commit('REMOVE_SOURCE_FROM_ALL_SCENES', {
      sourceId: data.sourceId
    });

    configFileManager.save();
  },

  refreshProperties({ commit, state }, data) {
    let source = state.sources[data.sourceId];
    commit('SET_SOURCE_PROPERTIES', {
      sourceId: data.sourceId,
      properties: Obs.sourceProperties(source.name, source.id)
    });
  },

  setSourceProperty({ dispatch, state }, data) {
    let source = state.sources[data.property.sourceId];

    Obs.setProperty(
      source.name,
      data.property.name,
      data.propertyValue
    );

    dispatch({
      type: 'refreshProperties',
      sourceId: data.property.sourceId
    });

    configFileManager.save();
  },

  createPropertiesRestorePoint({ commit }, data) {
    commit('CREATE_PROPERTIES_RESTORE_POINT', {
      sourceId: data.sourceId
    });
  },

  restoreProperties({ dispatch, state }, data) {
    let restorePoint = state.sources[data.sourceId].restorePoint;

    // TODO: Set each property in OBS

    dispatch({
      type: 'refreshProperties',
      sourceId: data.sourceId
    });
  },

  setSourceSize({ commit }, data) {
    commit('SET_SOURCE_SIZE', {
      sourceId: data.sourceId,
      width: data.width,
      height: data.height
    });
  },

  setSourcePosition({ commit, state }, data) {
    let source = state.sources[data.sourceId];
    Obs.setSourcePosition(source.name, data.x, data.y);

    commit('SET_SOURCE_POSITION', {
      sourceId: data.sourceId,
      x: data.x,
      y: data.y
    });
  },

  setSourceScale({ commit, state }, data) {
    let source = state.sources[data.sourceId];
    Obs.setSourceScale(source.name, data.scaleX, data.scaleY);

    commit('SET_SOURCE_SCALE', {
      sourceId: data.sourceId,
      scaleX: data.scaleX,
      scaleY: data.scaleY
    });
  },

  // Used to atomically set position and scale together.
  // This is required for smooth resizing.
  setSourcePositionAndScale({ commit, state }, data) {
    let source = state.sources[data.sourceId];

    Obs.setSourcePositionAndScale(source.name, data.x, data.y, data.scaleX, data.scaleY);

    if (data.x || data.y) {
      commit('SET_SOURCE_POSITION', {
        sourceId: data.sourceId,
        x: data.x,
        y: data.y
      });
    }

    if (data.scaleX || data.scaleY) {
      commit('SET_SOURCE_SCALE', {
        sourceId: data.sourceId,
        scaleX: data.scaleX,
        scaleY: data.scaleY
      });
    }
  },

  // Loads source position and scale from OBS
  loadSourcePositionAndScale({ commit, state }, data) {
    const source = state.sources[data.sourceId];

    const position = Obs.getSourcePosition(source.name);
    const scale = Obs.getSourceScale(source.name);

    commit('SET_SOURCE_POSITION', {
      sourceId: data.sourceId,
      x: position.x,
      y: position.y
    });

    commit('SET_SOURCE_SCALE', {
      sourceId: data.sourceId,
      scaleX: scale.x,
      scaleY: scale.y
    });
  }
};

const getters = {
  activeSource(state, getters) {
    if (getters.activeSourceId) {
      return state.sources[getters.activeSourceId];
    }
  },

  inactiveSources(state, getters) {
    let sourceIds = getters.activeScene.sources.filter(source => {
      return source.id !== getters.activeSourceId;
    });

    return sourceIds.map(id => {
      return state.sources[id];
    });
  },


  // Returns a function for fetching source properties
  sourceProperties(state) {
    return sourceId => {
      let source = state.sources[sourceId];

      if (source) {
        return source.properties;
      } else {
        return [];
      }
    };
  },

  // Returns a function for finding a source by name
  sourceByName(state) {
    return sourceName => {
      return _.find(state.sources, source => {
        return source.name === sourceName;
      });
    };
  }
};

export default {
  state,
  mutations,
  actions,
  getters
};
