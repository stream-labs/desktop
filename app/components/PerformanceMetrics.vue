<template>
<div class="performance-metrics flex flex--center">
  <span class="performance-metric-wrapper">
    <span class="performance-metric">
      CPU: {{ cpuPercent }}%
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span class="performance-metric">
      {{ frameRate }} FPS
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span class="performance-metric">
      Dropped Frames: {{ droppedFrames }} ({{ percentDropped }}%)
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <span class="performance-metric">
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

<script lang="ts" src="./PerformanceMetrics.vue.ts"></script>

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
  padding-left: 12px;

  &:before {
    content: '|';
    padding-right: 10px;
  }
}
</style>
