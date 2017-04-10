

const state = {
  width: 1280,
  height: 720,

  // This is the actual size of the canvas on screen
  renderedWidth: 0,
  renderedHeight: 0,
};

const mutations = {
  SET_VIDEO_RENDERED_SIZE(state, data) {
    state.renderedWidth = data.width;
    state.renderedHeight = data.height;
  }
};

const actions = {
  setVideoRenderedSize({ commit }, data) {
    commit('SET_VIDEO_RENDERED_SIZE', {
      width: data.width,
      height: data.height
    });
  }
}

export default {
  state,
  mutations,
  actions
};
