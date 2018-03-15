<template>
<button
  class="button button--go-live button--action"
  :class="{ 'button--soft-warning': getIsRedButton() }"
  :disabled="isDisabled"
  @click="toggleStreaming">{{getStreamButtonLabel()}}</button>
</template>

<script lang="ts" src="./StartStreamingButton.vue.ts"></script>

<style lang="less" scoped>
.button--go-live {
  width: 130px;
  text-transform: none;

  @media(max-width: 1200px) {
    font-size: 11px;
    width: 112px;
  }
}
</style>
