import { StatefulService, mutation } from './stateful-service';
import Obs from '../api/Obs';

export default class StreamingService extends StatefulService {

  get initialState() {
    return {
      isStreaming: false,
      streamStartTime: null,
      streamOk: null,
      isRecording: false,
      recordStartTime: null
    };
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
    this.state.streamOk = null;
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
  SET_STREAM_STATUS(isOk) {
    this.state.streamOk = isOk;
  }

  startStreaming() {
    if (!this.state.isStreaming) {
      Obs.startStreaming();
      const startTime = (new Date()).toISOString();
      this.START_STREAMING(startTime);

      this.streamCheckInterval = setInterval(() => {
        this.SET_STREAM_STATUS(Obs.checkStream());
      }, 10 * 1000);
    }
  }

  stopStreaming() {
    if (this.state.isStreaming) {
      Obs.stopStreaming();
      this.STOP_STREAMING();
      clearInterval(this.streamCheckInterval);
    }
  }

  startRecording() {
    if (!this.state.isRecording) {
      Obs.startRecording();
      const startTime = (new Date()).toISOString();
      this.START_RECORDING(startTime);
    }
  }

  stopRecording() {
    if (this.state.isRecording) {
      Obs.stopRecording();
      this.STOP_RECORDING();
    }
  }

}
