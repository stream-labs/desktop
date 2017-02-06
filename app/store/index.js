import Vue from 'vue';
import Vuex from 'vuex';
import navigation from './modules/navigation.js';
import scenes from './modules/scenes.js';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    navigation,
    scenes
  },
  strict: debug
});
