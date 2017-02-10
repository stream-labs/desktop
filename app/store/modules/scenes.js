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

  ADD_SOURCE(state, data) {
    state.scenes.find(scene => { 
      return scene.name === data.sceneName;
    }).sources.push(data.source);
  },

  MAKE_SOURCE_ACTIVE(state, data) {
    state.scenes.find(scene => {
      return scene.name === data.sceneName;
    }).activeSourceName = data.sourceName;
  },

  REMOVE_SOURCE(state, data) {
    // For now, assume the source is in the active
    let scene = state.scenes.find(scene => {
      return scene.name === data.sceneName;
    });

    scene.sources = _.reject(scene.sources, source => {
      return source.name === data.sourceName;
    });
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

  addSourceToScene({ commit, getters }, data) {
    Obs.createSource(
      getters.activeSceneName,
      data.sourceType,
      data.sourceName,
      data.settings,
      data.hotkeyData
    );

    commit('ADD_SOURCE', {
      sceneName: getters.activeSceneName,
      source: {
        type: data.sourceType,
        name: data.sourceName,
        settings: data.settings,
        hotkeyData: data.hotkeyData
      }
    });
  },

  makeSourceActive({ commit }, data) {
    commit('MAKE_SOURCE_ACTIVE', {
      sceneName: data.sceneName,
      sourceName: data.sourceName
    });
  },

  removeSource({ commit, getters }, data) {
    Obs.removeSource(data.sourceName);

    commit('REMOVE_SOURCE', {
      sourceName: data.sourceName,
      sceneName: data.sceneName
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

  activeSource(state, getters) {
    return getters.activeScene.sources.find(source => {
      return source.name === getters.activeScene.activeSourceName;
    });
  },

  activeSourceName(state, getters) {
    if (getters.activeScene) {
      return getters.activeScene.activeSourceName;
    } else {
      return null;
    }
  }
};

export default {
  state,
  mutations,
  actions,
  getters
}
