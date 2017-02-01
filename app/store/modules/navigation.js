const state = {
  currentPage: 'studio'
};

const mutations = {
  navigate(state, newPage) {
    state.currentPage = newPage;
  }
};

const actions = {
  navigate({ commit }, newPage) {
    commit('navigate', newPage);
  }
};

export default {
  state,
  mutations,
  actions
};
