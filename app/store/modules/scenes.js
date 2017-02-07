import Obs from '../../api/Obs.js';

const state = {
  activeSceneName: null,
  scenes: []
};

const mutations = {
  ADD_SCENE(state, data) {
    state.scenes.push(data.scene);
    state.activeSceneName = data.scene.name;
  },

  MAKE_SCENE_ACTIVE(state, data) {
    state.activeSceneName = data.sceneName;
  },

  ADD_SOURCE(state, data) {
    state.scenes.find(scene => { 
      return scene.name === data.sceneName;
    }).sources.push(data.source);
  }
};

const actions = {
  createNewScene({ commit }, data) {
    Obs.createScene(data.sceneName);

    commit('ADD_SCENE', {
      scene: {
        name: data.sceneName,
        sources: []
      }
    });
  },

  makeSceneActive({ commit }, data) {
    // TODO: Make scene active in OBS

    commit('MAKE_SCENE_ACTIVE', {
      sceneName: data.sceneName
    });
  },

  addSourceToScene({ commit }, data) {
    debugger;

    Obs.createSource(
      data.sceneName,
      data.sourceType,
      data.sourceName,
      data.settings,
      data.hotkeyData
    );

    commit('ADD_SOURCE', {
      sceneName: data.sceneName,
      source: {
        type: data.sourceType,
        name: data.sourceName,
        settings: data.settings,
        hotkeyData: data.hotkeyData
      }
    });
  }
};

const getters = {
  activeScene(state) {
    return state.scenes.find(scene => { 
      return scene.name === state.activeSceneName;
    });
  }
};

export default {
  state,
  mutations,
  actions,
  getters
}
