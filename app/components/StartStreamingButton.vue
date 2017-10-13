<template>
<button
  class="button button--go-live"
  :class="{'button--soft-warning': (streamingService.isStreaming && streamingService.stopStreaming), 'button--action': streamingService.startStreaming}"
  @click="toggleStreaming">
  {{ streamButtonLabel }}
</button>
</template>

<script lang="ts" src="./StartStreamingButton.vue.ts"></script>

<style lang="less" scoped>
.button--go-live {
  width: 140px;
}
</style>
