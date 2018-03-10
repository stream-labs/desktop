import { StatefulService, mutation } from 'services/stateful-service';
import { ObsApiService, EOutputCode } from 'services/obs-api';
import { Inject } from 'util/injector';

interface IStreamingServiceState {
  streamingStatus: EStreamingState;
  streamingStatusTime: string;
}

enum EOBSOutputType {
  Streaming = 'streaming',
  Recording = 'recording'
}

enum EOBSOutputSignal {
  Starting = 'starting',
  Start = 'start',
  Stopping = 'stopping',
  Stop = 'stop'
}

enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending'
}

interface IOBSOutputSignalInfo {
  type: EOBSOutputType;
  signal: EOBSOutputSignal;
  code: EOutputCode;
  error: string;
}

export class StreamingService extends StatefulService<IStreamingServiceState> {
  @Inject() obsApiService: ObsApiService;

  static initialState = {
    streamingStatus: EStreamingState.Offline,
    streamingStatusTime: new Date().toISOString()
  };

  init() {
    this.obsApiService.nodeObs.OBS_service_connectOutputSignals(
      (info: IOBSOutputSignalInfo) => {
        this.handleOBSOutputSignal(info);
      }
    );
  }

  /**
   * @deprecated Use toggleStreaming instead
   */
  startStreaming() {
    this.toggleStreaming();
  }

  /**
   * @deprecated Use toggleStreaming instead
   */
  stopStreaming() {
    this.toggleStreaming();
  }

  toggleStreaming() {
    if (this.state.streamingStatus === EStreamingState.Offline) {
      this.obsApiService.nodeObs.OBS_service_startStreaming();
      return;
    }

    if (
      this.state.streamingStatus === EStreamingState.Starting ||
      this.state.streamingStatus === EStreamingState.Live
    ) {
      this.obsApiService.nodeObs.OBS_service_stopStreaming(false);
      return;
    }

    if (this.state.streamingStatus === EStreamingState.Ending) {
      this.obsApiService.nodeObs.OBS_service_stopStreaming(true);
      return;
    }
  }

  private handleOBSOutputSignal(info: IOBSOutputSignalInfo) {
    if (info.type === EOBSOutputType.Streaming) {
      const time = new Date().toISOString();

      if (info.signal === EOBSOutputSignal.Start) {
        this.SET_STREAMING_STATUS(EStreamingState.Live, time);
      } else if (info.signal === EOBSOutputSignal.Starting) {
        this.SET_STREAMING_STATUS(EStreamingState.Starting, time);
      } else if (info.signal === EOBSOutputSignal.Stop) {
        this.SET_STREAMING_STATUS(EStreamingState.Offline, time);
      } else if (info.signal === EOBSOutputSignal.Stopping) {
        this.SET_STREAMING_STATUS(EStreamingState.Ending, time);
      } else {
        console.log('Ignoring streaming output signal: ', info.signal);
      }
    }

    if (info.code) {
      alert(`Got output error code: ${info.code}`);
    }
  }

  @mutation()
  private SET_STREAMING_STATUS(status: EStreamingState, time: string) {
    this.state.streamingStatus = status;
    this.state.streamingStatusTime = time;
  }
}
