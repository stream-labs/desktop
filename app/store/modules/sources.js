import Vue from 'vue';
import Obs from '../../api/Obs.js';
import _ from 'lodash';

const state = {
  sources: {}
};

const mutations = {
  ADD_SOURCE(state, data) {
    Vue.set(state.sources, data.sourceName, data.source);
  },

  REMOVE_SOURCE(state, data) {
    Vue.delete(state.sources, data.sourceName);
  },

  SET_SOURCE_PROPERTIES(state, data) {
    let source = state.sources[data.sourceName];

    source.properties = data.properties;
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

    const properties = Obs.sourceProperties(data.sourceName);

    commit('ADD_SOURCE', {
      sourceName: data.sourceName,
      source: {
        type: data.sourceType,
        properties,
        restorePoints: {}
      }
    });

    commit('ADD_SOURCE_TO_SCENE', {
      sourceName: data.sourceName,
      sceneName: data.sceneName
    });
  },

  removeSource({ commit }, data) {
    Obs.removeSource(data.sourceName);

    commit('REMOVE_SOURCE', {
      sourceName: data.sourceName
    });

    commit('REMOVE_SOURCE_FROM_ALL_SCENES', {
      sourceName: data.sourceName
    });
  },

  setSourceProperty({ commit }, data) {
    // TODO: Set sources in OBS

    // Refresh the state of source properties
    const properties = Obs.sourceProperties(data.property.source);

    commit('SET_SOURCE_PROPERTIES', {
      sourceName: data.property.source,
      properties
    });
  }
};

const getters = {
  activeSource(state, getters) {
    if (getters.activeSourceName) {
      return state.sources[getters.activeSourceName];
    }
  },

  // Returns a function for fetching saturated source properties
  sourceProperties(state) {
    return sourceName => {
      let source = state.sources[sourceName]

      if (source) {
        return _.map(source.properties, prop => {
          return Object.assign(prop, {
            source: sourceName
          });
        });
      } else {
        return [];
      }
    };
  }
};

export default {
  state,
  mutations,
  actions,
  getters
};
