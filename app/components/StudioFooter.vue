<template>
  <div class="footer">
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
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  padding: 8px;
  max-width: none;
  flex: 0 0 auto;
}
</style>
