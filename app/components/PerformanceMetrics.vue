<template>
  <div class="performance-metrics flex">
    <span class="performance-metric-wrapper resolution">
      <i class="performance-metric-icon icon-display"/>
      <span class="performance-metric">
        <span class="performance-metric__value">{{ outputResolution }}</span>
      </span>
    </span>

    <span class="performance-metric-wrapper cpu_percent">
      <i class="performance-metric-icon icon-cpu"/>
      <span class="performance-metric">
        <span class="performance-metric__value">{{ $t('common.cpu') }}{{ cpuPercent }}%</span>
      </span>
    </span>

    <span class="performance-metric-wrapper band_width">
      <i class="performance-metric-icon icon-kbps"/>
      <span class="performance-metric">
        <span class="performance-metric__value">{{ bandwidth }}</span> kbps
      </span>
    </span>

    <span class="performance-metric-wrapper frame_rate">
      <i class="performance-metric-icon icon-fps"/>
      <span class="performance-metric">
        <span class="performance-metric__value">{{ frameRate }}</span>&#47;<span class="performance-metric__value">{{ targetFrameRate }}FPS</span>
      </span>
    </span>

    <span class="performance-metric-wrapper dropped_frames">
      <i class="performance-metric-icon icon-drop-fps"/>
      <span class="performance-metric">
        <span class="performance-metric__value">{{ $t('common.droppedFrames') }}{{ droppedFrames }} ({{ percentDropped }}%)</span>
      </span>
    </span>
  </div>
</template>

<script lang="ts" src="./PerformanceMetrics.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";

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
  padding-right: 12px;
  color: @text-secondary;
  white-space: nowrap;
}

.performance-metric {
  vertical-align: middle;
}

.performance-metric-icon {
  font-size: 14px;
  width: auto;
  vertical-align: middle;
  margin-right: 4px;
}

.performance-metric__value {
  font-size: 14px;
}

.viewer_count,
.comment_count {
  min-width: 88px;
}
.resolution {
  min-width: 120px;
}
.cpu_percent {
  min-width: 168px;
}
.frame_rate {
  min-width: 136px;
}
.dropped_frames {
  min-width: 224px;
}
.band_width {
  min-width: 108px;
}

</style>
