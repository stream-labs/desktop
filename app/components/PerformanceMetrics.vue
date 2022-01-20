<template>
  <div class="performance-metrics flex">
    <span class="performance-metric-wrapper resolution" v-if="!compactMode">
      <i class="performance-metric-icon icon-display" />
      <span class="performance-metric">
        <span class="performance-metric__value">{{ outputResolution }}</span>
      </span>
    </span>

    <span class="performance-metric-wrapper cpu_percent">
      <i class="performance-metric-icon icon-cpu" />
      <span class="performance-metric">
        <span class="performance-metric__value">{{ $t('common.cpu') }}{{ cpuPercent }}%</span>
      </span>
    </span>

    <span class="performance-metric-wrapper band_width">
      <i class="performance-metric-icon icon-kbps" />
      <i class="icon-warning" v-if="bandWidthAlert" />
      <span class="performance-metric">
        <span class="performance-metric__value">{{ bandwidth }}</span> kbps
      </span>
    </span>

    <span class="performance-metric-wrapper frame_rate">
      <i class="performance-metric-icon icon-fps" />
      <span class="performance-metric">
        <span class="performance-metric__value">{{ frameRate }}</span
        >&#47;<span class="performance-metric__value">{{ targetFrameRate }}FPS</span>
      </span>
    </span>

    <span class="performance-metric-wrapper dropped_frames" v-if="!compactMode">
      <i class="performance-metric-icon icon-drop-fps" />
      <span class="performance-metric">
        <span class="performance-metric__value"
          >{{ $t('common.droppedFrames') }}{{ droppedFrames }} ({{ percentDropped }}%)</span
        >
      </span>
    </span>
  </div>
</template>

<script lang="ts" src="./PerformanceMetrics.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.performance-metrics {
  flex-wrap: wrap;
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
  padding-right: 16px;
  white-space: nowrap;
  position: relative;

  &.band_width {
    .icon-warning {
      top: 4px;
      left: 16px;
      font-size: @font-size4;
    }
  }
}

.performance-metric {
  vertical-align: middle;
}

.performance-metric-icon {
  width: auto;
  vertical-align: middle;
  margin-right: 8px;
  font-size: @font-size4;
  color: var(--color-text-dark);
}

.performance-metric__value {
  font-size: @font-size2;
  color: var(--color-text);
}

.icon-warning {
  color: var(--color-icon-alert);
  position: absolute;
}
</style>
