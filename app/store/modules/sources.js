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

  SET_SOURCE_AVAILABLE_PROPERTIES(state, data) {
    let source = state.sources[data.sourceName];

    source.availableProperties = data.availableProperties;
  },

  SET_SOURCE_PROPERTY_VALUE(state, data) {
    let source = state.sources[data.sourceName];

    Vue.set(source.propertyValues, data.propertyName, data.propertyValue);
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
      data.sourceName,
      {},
      {}
    );

    // TODO: Get default source settings from Obs

    commit('ADD_SOURCE', {
      sourceName: data.sourceName,
      source: {
        type: data.sourceType,
        availableProperties: Obs.sourceProperties(data.sourceName),
        propertyValues: {}
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

    commit('SET_SOURCE_PROPERTY_VALUE', {
      sourceName: data.sourceName,
      propertyName: data.propertyName,
      propertyValue: data.propertyValue
    });

    // Any time we set a property, we need to refresh the
    // set of available options on that source, since they
    // can change depending on what is selected.
    let availableProperties = Obs.sourceProperties(data.sourceName);

    commit('SET_SOURCE_AVAILABLE_PROPERTIES', {
      sourceName: data.sourceName,
      availableProperties
    });
  }
};

const getters = {
  activeSource(state, getters) {
    if (getters.activeSourceName) {
      return state.sources[getters.activeSourceName];
    }
  }
};

export default {
  state,
  mutations,
  actions,
  getters
};
