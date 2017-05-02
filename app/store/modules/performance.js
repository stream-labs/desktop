import Obs from '../../api/Obs';

const initialState = {
  CPU: 0,
  numberDroppedFrames: 0,
  percentageDroppedFrames: 0,
  bandwidth: 0,
  frameRate: 0
};

const mutations = {

  SET_PERFORMANCE_STATS(state, data) {
    Object.keys(data).forEach(stat => {
      state[stat] = data[stat];
    });
  }

};

const actions = {

  refreshPerformanceStats({ commit }) {
    commit('SET_PERFORMANCE_STATS', Obs.getPerformanceStatistics());
  }

};

export default {
  state: initialState,
  mutations,
  actions
};
