import Vue from 'vue';
import { StreamingService } from '../services/streaming';
import { PerformanceService } from '../services/performance';
import { Inject } from '../util/injector';
import { Component } from 'vue-property-decorator';

@Component({})
export default class PerformanceMetrics extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() performanceService: PerformanceService;

  get cpuPercent() {
    return this.performanceService.state.CPU.toFixed(1);
  }

  get frameRate() {
    return this.performanceService.state.frameRate.toFixed(2);
  }

  get droppedFrames() {
    return this.performanceService.state.numberDroppedFrames;
  }

  get percentDropped() {
    return (this.performanceService.state.percentageDroppedFrames || 0).toFixed(1);
  }

  get bandwidth() {
    return this.performanceService.state.bandwidth.toFixed(0);
  }
}
