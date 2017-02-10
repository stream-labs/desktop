import Obs from '../../api/Obs.js';
import _ from 'lodash';

const state = {
  sources: {}
};

const mutations = {
  ADD_SOURCE(state, data) {
    state.sources[data.sourceName] = data.source;
  },

  REMOVE_SOURCE(state, data) {
    state.sources = _.omit(state.sources, [data.sourceName]);
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
      data.settings,
      data.hotkeyData
    );

    commit('ADD_SOURCE', {
      sourceName: data.sourceName,
      source: {
        type: data.sourceType,
        settings: data.settings,
        hotkeyData: data.hotkeyData
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
