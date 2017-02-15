import Obs from '../../api/Obs.js';
import moment from 'moment';
import _ from 'lodash';

const state = {
  streaming: false,
  streamStartTime: null,
  recording: false,
  recordStartTime: null
};

const mutations = {
  START_STREAMING(state, data) {
    state.streaming = true;
    state.streamStartTime = data.streamStartTime;
  },

  STOP_STREAMING(state, data) {
    state.streaming = false;
    state.streamStartTime = null;
  },

  START_RECORDING(state, data) {
    state.recording = true;
    state.recordStartTime = data.recordStartTime;
  },

  STOP_RECORDING(state, data) {
    state.recording = false;
    state.recordStartTime = null;
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
  },

  startRecording({ commit }, data) {
    Obs.startRecording();

    // Since commits are serialized, we always convert to a string
    commit('START_RECORDING', {
      recordStartTime: (new Date()).toISOString()
    });
  },

  stopRecording({ commit }, data) {
    Obs.stopRecording();

    commit('STOP_RECORDING');
  }
};

const getters = {
  isStreaming(state) {
    return state.streaming;
  },

  streamStartTime(state) {
    // De-serialize the timestamp
    return moment(state.streamStartTime);
  },

  isRecording(state) {
    return state.recording;
  },

  recordStartTime(state) {
    // De-serialize the timestamp
    return moment(state.recordStartTime);
  }
}

export default {
  state,
  mutations,
  actions,
  getters
};
