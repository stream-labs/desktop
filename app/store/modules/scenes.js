import Obs from '../../api/Obs.js';
import _ from 'lodash';

const state = {
  activeSceneName: null,
  scenes: []
};

const mutations = {
  ADD_SCENE(state, data) {
    state.scenes.push(data.scene);
    state.activeSceneName = state.activeSceneName || data.scene.name;
  },

  REMOVE_SCENE(state, data) {
    state.scenes = _.reject(state.scenes, scene => {
      return scene.name === data.sceneName;
    });
  },

  MAKE_SCENE_ACTIVE(state, data) {
    state.activeSceneName = data.sceneName;
  },

  ADD_SOURCE_TO_SCENE(state, data) {
    state.scenes.find(scene => { 
      return scene.name === data.sceneName;
    }).sources.push(data.sourceName);
  },

  REMOVE_SOURCE_FROM_ALL_SCENES(state, data) {
    _.each(state.scenes, scene => {
      scene.sources = _.without(scene.sources, data.sourceName);
    });
  },

  MAKE_SOURCE_ACTIVE(state, data) {
    state.scenes.find(scene => {
      return scene.name === data.sceneName;
    }).activeSourceName = data.sourceName;
  }
};

const actions = {
  createNewScene({ commit }, data) {
    Obs.createScene(data.sceneName);

    commit('ADD_SCENE', {
      scene: {
        name: data.sceneName,
        activeSourceName: null,
        sources: []
      }
    });
  },

  removeScene({ commit }, data) {
    Obs.removeScene(data.sceneName);

    // TODO: handle switching of active scene

    commit('REMOVE_SCENE', {
      sceneName: data.sceneName
    });
  },

  makeSceneActive({ commit }, data) {
    // TODO: Make scene active in OBS

    commit('MAKE_SCENE_ACTIVE', {
      sceneName: data.sceneName
    });
  },

  makeSourceActive({ commit }, data) {
    commit('MAKE_SOURCE_ACTIVE', {
      sceneName: data.sceneName,
      sourceName: data.sourceName
    });
  }
};

const getters = {
  activeScene(state) {
    return state.scenes.find(scene => { 
      return scene.name === state.activeSceneName;
    });
  },

  activeSceneName(state) {
    return state.activeSceneName;
  },

  activeSourceName(state, getters) {
    if (getters.activeScene) {
      return getters.activeScene.activeSourceName;
    }
  }
};

export default {
  state,
  mutations,
  actions,
  getters
}
