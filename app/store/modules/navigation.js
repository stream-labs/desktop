const state = {
  currentPage: 'Studio'
};

const mutations = {
  navigate(state, data) {
    state.currentPage = data.pageName;
  }
};

const actions = {
  navigate({ commit }, data) {
    commit('navigate', {
      pageName: data.pageName
    });
  }
};

export default {
  state,
  mutations,
  actions
};
