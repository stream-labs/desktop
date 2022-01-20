<template>
  <div v-if="compactMode">
    <div class="footer streaming-controller">
      <streaming-controller :locked="locked" />
    </div>
    <div class="footer performance-metrics">
      <div class="flex flex--center flex--grow flex--justify-start">
        <performance-metrics />
      </div>
    </div>
  </div>
  <div class="footer" v-else>
    <div class="flex flex--center flex--grow flex--justify-start">
      <performance-metrics />
    </div>
    <streaming-controller :locked="locked" />
  </div>
</template>

<script lang="ts" src="./StudioFooter.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.footer {
  .dividing-border;

  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  padding: 0 16px;
  max-width: none;
  height: 64px;
  flex: 0 0 auto;
  background-color: var(--color-bg-primary);

  &.streaming-controller /deep/ .nav-container {
    flex-grow: 1;
  }

  &.performance-metrics {
    height: 32px;
    background-color: var(--color-bg-secondary);
  }
}
</style>
