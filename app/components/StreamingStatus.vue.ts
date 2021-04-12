import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { StreamingService, EStreamingState } from '../services/streaming';
import { Inject } from '../services/core/injector';

@Component({})
export default class StreamingStatus extends Vue {
  @Inject() streamingService: StreamingService;

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get liveText() {
    if (this.streamingStatus === EStreamingState.Live) return 'LIVE';
    if (this.streamingStatus === EStreamingState.Starting) return 'STARTING';
    if (this.streamingStatus === EStreamingState.Ending) return 'ENDING';
    if (this.streamingStatus === EStreamingState.Reconnecting) return 'RECONNECTING';
    return 'OFFLINE';
  }
}
