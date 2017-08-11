<template>
<div class="performance-metrics flex flex--center">
  <span class="performance-metric-wrapper">
    <span
      class="performance-metric">
      CPU: {{ cpuPercent }}
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span
      class="performance-metric">
      {{ frameRate }} FPS
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span class="performance-metric">
      Dropped Frames: {{ droppedFrames }} ({{ percentDropped }}%)
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span
      class="performance-metric">
      {{ bandwidth }} kb/s
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span
      v-if="this.streamingService.isStreaming && this.streamOk !== null"
      class="performance-metric">
      {{ streamStatusMsg }}
    </span>
    <span v-else></span>
  </span>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import StreamingService from '../services/streaming';
import { PerformanceService } from '../services/performance';
import { Inject } from '../services/service';
import { Component } from 'vue-property-decorator';
import { compact } from 'lodash';

@Component({})
export default class PerformanceMetrics extends Vue {

  @Inject()
  streamingService: StreamingService;

  @Inject()
  performanceService: PerformanceService;

  get cpuPercent() {
    return this.performanceService.state.CPU;
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

  get streamOk() {
    return this.streamingService.streamOk;
  }

  get streamStatusMsg() {
    if (this.streamingService.isStreaming && this.streamOk !== null) {
      if (this.streamOk) {
        return 'Stream OK';
      }

      return 'Stream Error';
    }

    return null;
  }

}
</script>
<style lang="less">
.performance-metric-wrapper {
  &:first-child {
    .performance-metric {
      padding-left: 0;

      &:before {
        content: '';
        padding-right: 0;
      }
    }
  }
}

.performance-metric {
  padding-left: 10px;

  &:before {
    content: '|';
    padding-right: 10px;
  }
}
</style>
