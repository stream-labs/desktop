<template>
<div>
  <div :class="{ 'streaming-status-pulse': true, 'streaming-status-offline': !isStreaming  }" />
  <span class="streaming-status-text">
    {{ liveText }}
  </span>
</div>
</template>

<script lang="ts" src="./StreamingStatus.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";
@import "../styles/mixins";

.streaming-status-text {
  margin: 0 2px 0 4px;
  .semibold;
  color: @white;
}

.streaming-status-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: @red;
  margin: 0 6px;
  box-shadow: 0 0 0 rgba(252, 62, 63, 0.4);

  &.streaming-status-offline {
    background: @grey;
    animation: none;
  }
}

</style>
