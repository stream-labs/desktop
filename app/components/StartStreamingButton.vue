<template>
<button
  class="button button--action button--md button--go-live"
  @click="toggleStreaming">
  {{ streamButtonLabel }}
</button>
</template>

<script lang="ts" src="./StartStreamingButton.vue.ts"></script>

<style lang="less" scoped>
.button--go-live {
  width: 100px;
}
</style>
