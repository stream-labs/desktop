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

    if (state.activeSceneName === data.sceneName) {
      if (state.scenes[0]) {
        state.activeSceneName = state.scenes[0].name;
      }
    }
  },

  MAKE_SCENE_ACTIVE(state, data) {
    state.activeSceneName = data.sceneName;
  },

  // Order is an array of names
  SET_SCENE_ORDER(state, data) {
    // TODO: This is a O(n^2) operation, probably not a big
    // deal, but this should be handled better.
    state.scenes = _.map(data.order, sceneName => {
      return _.find(state.scenes, scene => {
        return scene.name === sceneName;
      });
    });
  },

  ADD_SOURCE_TO_SCENE(state, data) {
    state.scenes.find(scene => { 
      return scene.name === data.sceneName;
    }).sources.push(data.sourceId);
  },

  REMOVE_SOURCE_FROM_ALL_SCENES(state, data) {
    _.each(state.scenes, scene => {
      scene.sources = _.without(scene.sources, data.sourceId);
    });
  },

  MAKE_SOURCE_ACTIVE(state, data) {
    state.scenes.find(scene => {
      return scene.name === data.sceneName;
    }).activeSourceId = data.sourceId;
  },

  SET_SOURCE_ORDER(state, data) {
    state.scenes.find(scene => {
      return scene.name === data.sceneName;
    }).sources = data.order;
  }
};

const actions = {
  createNewScene({ commit }, data) {
    Obs.createScene(data.sceneName);

    commit('ADD_SCENE', {
      scene: {
        name: data.sceneName,
        activeSourceId: null,
        sources: []
      }
    });
  },

  removeScene({ commit }, data) {
    Obs.removeScene(data.sceneName);

    commit('REMOVE_SCENE', {
      sceneName: data.sceneName
    });
  },

  makeSceneActive({ commit }, data) {
    Obs.setCurrentScene(data.sceneName);

    commit('MAKE_SCENE_ACTIVE', {
      sceneName: data.sceneName
    });
  },

  setSceneOrder({ commit }, data) {
    commit('SET_SCENE_ORDER', {
      order: data.order
    });
  },

  makeSourceActive({ commit }, data) {
    commit('MAKE_SOURCE_ACTIVE', {
      sceneName: data.sceneName,
      sourceId: data.sourceId
    });
  },

  setSourceOrder({ commit }, data) {
    // TODO: Set order in OBS

    commit('SET_SOURCE_ORDER', {
      sceneName: data.sceneName,
      order: data.order
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

  activeSourceId(state, getters) {
    if (getters.activeScene) {
      return getters.activeScene.activeSourceId;
    }
  },

  sceneByName(state) {
    return sceneName => {
      return _.find(state.scenes, scene => {
        return scene.name === sceneName;
      });
    };
  }
};

export default {
  state,
  mutations,
  actions,
  getters
}
