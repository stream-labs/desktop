<template>
<div class="performance-metrics flex flex--center">
  <span class="performance-metric-wrapper">
    <i class="performance-metric-icon icon-cpu"></i>
    <span class="performance-metric">
      <span class="performance-metric__value">{{ cpuPercent }}%</span>
      <span class="performance-metric__label">{{ $t('CPU') }}</span>
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <img class="performance-metric-icon" src="../../media/images/icons/fps.png">
    <span class="performance-metric">
      <span class="performance-metric__value">{{ frameRate }}</span>
      <span class="performance-metric__label">FPS</span>
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <img class="performance-metric-icon" src="../../media/images/icons/dropped-frames.png">
    <span class="performance-metric">
      <span class="performance-metric__value">{{ droppedFrames }} ({{ percentDropped }}%)</span>
      <span class="performance-metric__label">{{ $t('Dropped Frames') }}</span>
    </span>
  </span>

  <span class="performance-metric-wrapper">
    <img class="performance-metric-icon" src="../../media/images/icons/speed.png">
    <span class="performance-metric">
      <span class="performance-metric__value">{{ bandwidth }}</span>
      <span class="performance-metric__label">kb/s</span>
    </span>
  </span>
</div>
</template>

<script lang="ts" src="./PerformanceMetrics.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.performance-metrics {
  .performance-metric-wrapper {
    &:first-child {
      &::before {
        content: '';
        padding-right: 0;
      }
    }
  }
}

.performance-metric-wrapper {
  .padding-right();

  color: var(--icon);
  white-space: nowrap;
  display: flex;
  align-items: center;

  &::before {
    .padding-right();

    content: '|';
    opacity: 0.5;
  }

  // @media (max-width: 1300px) {
  //   font-size: 12px;
  // }
}

.performance-metric {
  vertical-align: middle;
}

.performance-metric-icon {
  .margin-right();

  height: 14px;
  width: auto;
  vertical-align: text-top;

  @media (max-width: 1200px) {
    display: none;
  }

  @media (max-width: 1300px) {
    height: 12px;
  }
}

.performance-metric__value {
  .weight(@medium);
}
</style>