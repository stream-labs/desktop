

const state = {
  width: 1920,
  height: 1080
};

const getters = {
  aspectRatio: state => {
    return state.width / state.height;
  }
};

export default {
  state,
  getters
};
