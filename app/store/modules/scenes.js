import Obs from '../../api/Obs.js';

const state = {
  activeScene: null,
  scenes: []
};

const mutations = {
  ADD_SCENE(state, scene) {
    state.scenes.push(scene);
    state.activeScene = scene;
  },

  MAKE_SCENE_ACTIVE(state, scene) {
    state.activeScene = scene;
  },

  ADD_SOURCE(state, scene, source) {
    let scenes = state.scenes;

    scenes[scene].sources.push(source);

    state.scenes = scenes;
  }
};

const actions = {
  addNewScene({ commit }, scene) {
    commit('ADD_SCENE', scene);
  },

  makeSceneActive({ commit }, scene) {
    commit('MAKE_SCENE_ACTIVE', scene);
  },

  addSourceToScene({ commit }, scene, source) {
    commit('ADD_SOURCE', scene, source);
  }
};

export default {
  state,
  mutations,
  actions
}
