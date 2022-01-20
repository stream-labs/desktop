<template>
<button
  class="button button--go-live"
  :class="{ 'button--soft-warning': isStreaming }"
  :disabled="isDisabled"
  @click="toggleStreaming"
  data-test="StartStreamingButton"
  :data-test-status="streamingStatus">
  <StartStreamingIcon v-if="isStreaming" />
  <i v-if="!isStreaming" class="icon-video"/>
  {{getStreamButtonLabel()}}
</button>
</template>

<script lang="ts" src="./StartStreamingButton.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.button--go-live {
  min-width: 120px;
  font-size: @font-size4;
}

/deep/ .svg-live {
  margin-right: 4px;
  margin-bottom: 2px;
  width: 18px;
  height: 16px;
  fill: #ffffff;
  vertical-align: middle;
}
</style>
