import moment from 'moment';

import { StatefulService, mutation } from './stateful-service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;

export default class StreamingService extends StatefulService {

  static initialState = {
    isStreaming: false,
    streamStartTime: null,
    isRecording: false,
    recordStartTime: null,
    streamOk: null
  }

  @mutation
  START_STREAMING(startTime) {
    this.state.isStreaming = true;
    this.state.streamStartTime = startTime;
  }

  @mutation
  STOP_STREAMING() {
    this.state.isStreaming = false;
    this.state.streamStartTime = null;
  }

  @mutation
  START_RECORDING(startTime) {
    this.state.isRecording = true;
    this.state.recordStartTime = startTime;
  }

  @mutation
  STOP_RECORDING() {
    this.state.isRecording = false;
    this.state.recordStartTime = null;
  }

  @mutation
  SET_STREAM_STATUS(streamOk) {
    this.state.streamOk = streamOk;
  }

  // Only runs once per app lifecycle
  init() {
    // Initialize the stream check interval
    setInterval(() => {
      let status;

      if (this.state.isStreaming) {
        status = nodeObs.OBS_service_isStreamingOutputActive() === '1';
      } else {
        status = null;
      }

      this.SET_STREAM_STATUS(status);
    }, 10 * 1000);
  }

  startStreaming() {
    if (this.state.isStreaming) return;

    nodeObs.OBS_service_startStreaming();
    this.START_STREAMING((new Date()).toISOString());
  }

  stopStreaming() {
    if (!this.state.isStreaming) return;

    nodeObs.OBS_service_stopStreaming();
    this.STOP_STREAMING();
    this.SET_STREAM_STATUS(null);
  }

  startRecording() {
    if (this.state.isRecording) return;

    nodeObs.OBS_service_startRecording();
    this.START_RECORDING((new Date()).toISOString());
  }

  stopRecording() {
    if (!this.state.isRecording) return;

    nodeObs.OBS_service_stopRecording();
    this.STOP_RECORDING();
  }

  // Getters

  get isStreaming() {
    return this.state.isStreaming;
  }

  get streamStartTime() {
    return moment(this.state.streamStartTime);
  }

  get streamOk() {
    return this.state.streamOk;
  }

  get isRecording() {
    return this.state.isRecording;
  }

  get recordStartTime() {
    return moment(this.state.recordStartTime);
  }

}
