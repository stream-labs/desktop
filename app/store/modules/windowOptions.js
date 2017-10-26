// This module handles windowOptions.  This is the only
// piece of the vuex store that is not synchronized
// between various windows.  These are unique to the
// current window, and tell the window what it should
// be displaying currently.

const state = {
  options: {},
  isChild: false
};

const mutations = {
  SET_WINDOW_OPTIONS(state, data) {
    state.options = data.options;
  },

  SET_WINDOW_AS_CHILD(state) {
    state.isChild = true;
  }
};

const actions = {
  setWindowOptions({ commit }, data) {
    commit('SET_WINDOW_OPTIONS', {
      options: data.options,
      __vuexSyncIgnore: true
    });
  },

  setWindowAsChild({ commit }) {
    commit('SET_WINDOW_AS_CHILD', {
      __vuexSyncIgnore: true
    });
  }
};

export default {
  state,
  mutations,
  actions
};
