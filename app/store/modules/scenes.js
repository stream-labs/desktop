import Obs from '../../api/Obs.js';
import _ from 'lodash';
import configFileManager from '../../util/ConfigFileManager.js';

const state = {
  activeSceneName: null,
  scenes: []
};

const mutations = {
  RESET_SCENES(state) {
    state.activeSceneName = null;
    state.scenes = [];
  },

  ADD_SCENE(state, data) {
    state.scenes.push({
      name: data.name,
      activeSourceId: null,
      sources: []
    });

    state.activeSceneName = state.activeSceneName || data.name;
  },

  REMOVE_SCENE(state, data) {
    state.scenes = _.reject(state.scenes, scene => {
      return scene.name === data.sceneName;
    });
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
    }).sources.unshift(data.sourceId);
  },

  REMOVE_SOURCE_FROM_ALL_SCENES(state, data) {
    _.each(state.scenes, scene => {
      if (scene.activeSourceId === data.sourceId) {
        scene.activeSourceId = null;
      }

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
  createNewScene({ commit, dispatch }, data) {
    Obs.createScene(data.sceneName);

    commit('ADD_SCENE', {
      name: data.sceneName
    });

    dispatch({
      type: 'makeSceneActive',
      sceneName: data.sceneName
    });

    configFileManager.save();
  },

  removeScene({ commit, getters, dispatch, state }, data) {
    Obs.removeScene(data.sceneName);

    commit('REMOVE_SCENE', {
      sceneName: data.sceneName
    });

    if (getters.activeSceneName === data.sceneName) {
      if (state.scenes[0]) {
        dispatch({
          type: 'makeSceneActive',
          sceneName: state.scenes[0].name
        });
      }
    }

    configFileManager.save();
  },

  makeSceneActive({ commit }, data) {
    Obs.setCurrentScene(data.sceneName);

    commit('MAKE_SCENE_ACTIVE', {
      sceneName: data.sceneName
    });

    configFileManager.save();
  },

  setSceneOrder({ commit }, data) {
    commit('SET_SCENE_ORDER', {
      order: data.order
    });
  },

  makeSourceActive({ commit, rootState }, data) {
    // TODO: Properly handle multile active sources
    if (data.sourceId) {
      const source = rootState.sources.sources[data.sourceId];
      Obs.setActiveSources([source.name]);
    } else {
      Obs.setActiveSources([]);
    }

    commit('MAKE_SOURCE_ACTIVE', {
      sceneName: data.sceneName,
      sourceId: data.sourceId
    });
  },

  setSourceOrder({ commit }, data) {
    let operation;

    if (data.positionDelta > 0) {
      operation = 'move_down';
    } else {
      operation = 'move_up';
    }

    _.times(Math.abs(data.positionDelta), () => {
      Obs.moveSource(data.sourceName, operation);
    });

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
