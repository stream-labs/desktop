import moment from 'moment';
import Obs from '../../api/Obs';

const initialState = {
  streaming: false,
  streamStartTime: null,
  recording: false,
  recordStartTime: null,
  streamOk: null
};

// Param reassign is normally bad, vuex encourages it in mutations.
/* eslint-disable no-param-reassign */
const mutations = {
  START_STREAMING(state, data) {
    state.streaming = true;
    state.streamStartTime = data.streamStartTime;
  },

  STOP_STREAMING(state) {
    state.streaming = false;
    state.streamStartTime = null;
  },

  START_RECORDING(state, data) {
    state.recording = true;
    state.recordStartTime = data.recordStartTime;
  },

  STOP_RECORDING(state) {
    state.recording = false;
    state.recordStartTime = null;
  },

  SET_STREAM_STATUS(state, data) {
    state.streamOk = data.streamOk;
  }
};
/* eslint-enable */

let streamCheckInterval;

const actions = {
  startStreaming({ commit, state }) {
    if (!state.streaming) {
      Obs.startStreaming();

      // Lazily start the stream check interval.  If the stream
      // gets restarted from a different window later, then this
      // will be running twice, which isn't a big deal, but worth
      // cleaning up at some point.
      if (!streamCheckInterval) {
        streamCheckInterval = setInterval(() => {
          let status;

          if (state.streaming) {
            status = Obs.checkStream();
          } else {
            status = null;
          }

          commit('SET_STREAM_STATUS', {
            streamOk: status
          });
        }, 10 * 1000);
      }

      // Since commits are serialized, we always convert to a string
      commit('START_STREAMING', {
        streamStartTime: (new Date()).toISOString()
      });
    }
  },

  stopStreaming({ commit, state }) {
    if (state.streaming) {
      Obs.stopStreaming();

      commit('STOP_STREAMING');
    }
  },

  startRecording({ commit, state }) {
    if (!state.recording) {
      Obs.startRecording();

      // Since commits are serialized, we always convert to a string
      commit('START_RECORDING', {
        recordStartTime: (new Date()).toISOString()
      });
    }
  },

  stopRecording({ commit, state }) {
    if (state.recording) {
      Obs.stopRecording();

      commit('STOP_RECORDING');
    }
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
};

export default {
  state: initialState,
  mutations,
  actions,
  getters
};
