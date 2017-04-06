import Vue from 'vue';
import Obs from '../../api/Obs.js';
import _ from 'lodash';

const state = {
  sources: {}
};

const mutations = {
  ADD_SOURCE(state, data) {
    Vue.set(state.sources, data.source.id, data.source);
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

    source.scaledWidth = source.width * source.scaleX;
    source.scaledHeight = source.height * source.scaleY;
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

    source.scaledWidth = source.width * source.scaleX;
    source.scaledHeight = source.height * source.scaleY;
  },

  CREATE_SOURCE_DISPLAY(state, data) {
    let source = state.sources[data.sourceId];

    source.display = data.display;
  },
  
  REMOVE_SOURCE_DISPLAY(state, data) {
    let source = state.sources[data.sourceId];
  }
};

const actions = {
  // node-obs does not currently support adding an existing
  // source to a scene. The state and mutations are set up
  // to support this in the future, but actions will match
  // the current capability of node-obs.
  createSourceAndAddToScene({ commit }, data) {
    Obs.createSource(
      data.sceneName,
      data.sourceType,
      data.sourceName
    );

    const properties = Obs.sourceProperties(data.sourceName, data.sourceId);

    commit('ADD_SOURCE', {
      source: {
        id: data.sourceId,
        name: data.sourceName,
        type: data.sourceType,
        properties,
        restorePoint: null,
        x: 0,
        y: 0,

        // Original frame size
        width: 0,
        height: 0,

        // Scaling factor
        scaleX: 1.0,
        scaleY: 1.0,

        // These are a function of dimensions and scale
        scaledWidth: 0,
        scaledHeight: 0
      }
    });

    commit('ADD_SOURCE_TO_SCENE', {
      sourceId: data.sourceId,
      sceneName: data.sceneName
    });

    commit('MAKE_SOURCE_ACTIVE', {
      sourceId: data.sourceId,
      sceneName: data.sceneName
    });
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

  createSourceDisplay({ commit, state }, data) {
    console.log("CREATING DISPLAY");
    let source = state.sources[data.sourceId];
    const display = Obs.createSourceDisplay(data.windowHandle, source.name, "Preview Window");

    commit('CREATE_SOURCE_DISPLAY', {
      sourceId: data.sourceId,
      display: display
    });
  },

  removeSourceDisplay({ commit, state }, data) {
    let source = state.sources[data.sourceId];
    Obs.removeSourceDisplay("Preview Window");

    commit('REMOVE_SOURCE_DISPLAY', {
      sourceId: data.sourceId,
    });
  },
};

const getters = {
  activeSource(state, getters) {
    if (getters.activeSourceId) {
      return state.sources[getters.activeSourceId];
    }
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
