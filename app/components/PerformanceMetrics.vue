<template>
<div class="performance-metrics flex flex--center">
  <span class="performance-metric-wrapper">
    <i class="performance-metric-icon icon-cpu"></i>
    <span class="performance-metric">
      <span class="performance-metric__value">{{ cpuPercent }}%</span> {{ $t('CPU') }}
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <img class="performance-metric-icon" src="../../media/images/icons/fps.png">
    <span class="performance-metric">
      <span class="performance-metric__value">{{ frameRate }}</span> FPS
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <img class="performance-metric-icon" src="../../media/images/icons/dropped-frames.png">
    <span class="performance-metric">
      <span class="performance-metric__value">{{ droppedFrames }} ({{ percentDropped }}%)</span> {{ $t('Dropped Frames') }}
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <img class="performance-metric-icon" src="../../media/images/icons/speed.png">
    <span class="performance-metric">
      <span class="performance-metric__value">{{ bandwidth }}</span> kb/s
    </span>
  </span>
</div>
</template>

<script lang="ts" src="./PerformanceMetrics.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.performance-metrics {
  .performance-metric-wrapper {
    &:first-child {
      &:before {
        content: '';
        padding-right: 0;
      }
    }
  }
}

.performance-metric-wrapper {
  padding-right: 12px;
  color: @grey;
  white-space: nowrap;

  &:before {
    content: '|';
    padding-right: 12px;
    opacity: .5;
  }

  @media(max-width: 1300px) {
    font-size: 12px;
  }
}

.performance-metric {
  vertical-align: middle;
}

.performance-metric-icon {
  height: 14px;
  width: auto;
  vertical-align: text-top;
  margin-right: 4px;

  @media(max-width: 1200px) {
    display: none;
  }

  @media(max-width: 1300px) {
    height: 12px;
  }
}

.performance-metric__value {
  .weight(@medium);
}
</style>