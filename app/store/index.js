import Vue from 'vue';
import Vuex from 'vuex';
import navigation from './modules/navigation.js';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    navigation
  },
  strict: debug
});
