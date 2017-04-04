

const state = {
  width: 1920,
  height: 1080,

  // This is the actual size of the canvas on screen
  renderedWidth: 0,
  renderedHeight: 0,

  display: 0
};

const mutations = {
  SET_VIDEO_RENDERED_SIZE(state, data) {
    state.renderedWidth = data.width;
    state.renderedHeight = data.height;
  },

  SET_VIDEO_DISPLAY(state, data) {
    state.display = data.handle;
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
