import Vue from 'vue';
import { CompactModeService } from 'services/compact-mode';
import { Inject } from 'services/core/injector';
import { StreamingService } from 'services/streaming';
import { Component } from 'vue-property-decorator';

@Component({})
export default class BottomLine extends Vue {
  @Inject()
  streamingService: StreamingService;
  @Inject()
  compactModeService: CompactModeService;

  get isStreaming(): boolean {
    return this.streamingService.state.streamingStatus === 'live';
  }

  get isCompactMode(): boolean {
    return this.compactModeService.compactMode;
  }
}
