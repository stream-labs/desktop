import Obs from '../../api/Obs.js';
import moment from 'moment';
import _ from 'lodash';

const state = {
  streaming: false,
  streamStartTime: null
};

const mutations = {
  START_STREAMING(state, data) {
    state.streaming = true;
    state.streamStartTime = data.streamStartTime;
  },

  STOP_STREAMING(state, data) {
    state.streaming = false;
    state.streamStartTime = null;
  }
};

const actions = {
  startStreaming({ commit }, data) {
    Obs.startStreaming();

    // Since commits are serialized, we always convert to a string
    commit('START_STREAMING', {
      streamStartTime: (new Date()).toISOString()
    });
  },

  stopStreaming({ commit }, data) {
    Obs.stopStreaming();

    commit('STOP_STREAMING');
  }
};

const getters = {
  isStreaming(state) {
    return state.streaming;
  },

  streamStartTime(state) {
    // De-serialize the timestamp
    return moment(state.streamStartTime);
  }
}

export default {
  state,
  mutations,
  actions,
  getters
};
