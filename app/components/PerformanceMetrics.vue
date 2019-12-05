<template>
<div class="performance-metrics flex flex--center">
  <span
    :class="[
      'performance-metric-wrapper', classForStat('cpu')]"
    @click="() => (updatePinnedStats('cpu', !pinnedStats.cpu))"
    v-tooltip="pinTooltip('CPU')"
    v-if="showCPU"
  >
    <i class="performance-metric-icon icon-cpu"></i>
    <span class="performance-metric">
      <span class="performance-metric__value">{{ cpuPercent }}%</span>
      <span class="performance-metric__label">{{ $t('CPU') }}</span>
    </span>
  </span>

  <span
    :class="['performance-metric-wrapper', classForStat('fps')]"
    @click="() => (updatePinnedStats('fps', !pinnedStats.fps))"
    v-tooltip="pinTooltip('FPS')"
    v-if="showFPS"
  >
    <i class="performance-metric-icon icon-fps"></i>
    <span class="performance-metric">
      <span class="performance-metric__value">{{ frameRate }}</span>
      <span class="performance-metric__label">FPS</span>
    </span>
  </span>

  <span
    :class="['performance-metric-wrapper', classForStat('droppedFrames')]"
    @click="() => (updatePinnedStats('droppedFrames', !pinnedStats.droppedFrames))"
    v-tooltip="pinTooltip('dropped frames')"
    v-if="showDroppedFrames"
  >
    <i class="performance-metric-icon icon-dropped-frames"></i>
    <span class="performance-metric">
      <span class="performance-metric__value">{{ droppedFrames }} ({{ percentDropped }}%)</span>
      <span v-if="mode === 'full'" class="performance-metric__label">{{ $t('Dropped Frames') }}</span>
    </span>
  </span>

  <span
    :class="['performance-metric-wrapper', classForStat('bandwidth')]"
    @click="() => (updatePinnedStats('bandwidth', !pinnedStats.bandwidth))"
    v-tooltip="pinTooltip('bandwidth')"
    v-if="showBandwidth"
  >
    <i class="performance-metric-icon icon-bitrate"></i>
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
  background: var(--background);
  height: calc(100% - 30px);
}

.performance-metric-wrapper {
  .padding-right();

  color: var(--paragraph);
  white-space: nowrap;
  display: flex;
  align-items: center;

  &::before {
    .padding-right();

    content: '|';
    opacity: 0.5;
  }
}

.performance-metric-wrapper.active {
  background: var(--input-border);
}

.performance-metric-wrapper.clickable {
  cursor: pointer;
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