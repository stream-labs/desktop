import Obs from '../../api/Obs.js';

const state = {
  // This represents the unscaled base width and height of the
  // video.  Note that this can be different than the actual output
  // resolution that is being streamed.
  width: 1920,
  height: 1080,

  // This contains a bounding rectangle that represents
  // the renderable video output region of the preview display
  displayOutputRegion: {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
};

const mutations = {
  SET_DISPLAY_OUTPUT_REGION(state, data) {
    state.displayOutputRegion.x = data.x;
    state.displayOutputRegion.y = data.y;
    state.displayOutputRegion.width = data.width;
    state.displayOutputRegion.height = data.height;
  }
};

const actions = {
  updateDisplayOutputRegion({ commit }) {
    // TODO: We should stop hardcoding 'Main Window' everywhere
    const region = Obs.getDisplayOutputRegion('Main Window');

    commit('SET_DISPLAY_OUTPUT_REGION', region);
  }
}

export default {
  state,
  mutations,
  actions
};
