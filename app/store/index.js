import Vue from 'vue';
import Vuex from 'vuex';
import navigation from './modules/navigation.js';
import scenes from './modules/scenes.js';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const actions = {

  // Create a bunch of test scenes and sources
  initTestData({ dispatch }) {
    dispatch({
      type: 'createNewScene',
      sceneName: 'Example Scene 1'
    });
    dispatch({
      type: 'createNewScene',
      sceneName: 'Example Scene 2'
    });
    dispatch({
      type: 'createNewScene',
      sceneName: 'Example Scene 3'
    });

    dispatch({
      type: 'makeSceneActive',
      sceneName: 'Example Scene 1'
    })

    dispatch({
      type: 'addSourceToScene',
      sceneName: 'Example Scene 1',
      sourceType: 'Video Capture Device',
      sourceName: 'Video Capture 1',
      settings: {},
      hotkeyData: {}
    });
  }
};

export default new Vuex.Store({
  modules: {
    navigation,
    scenes
  },
  actions,
  strict: debug
});
