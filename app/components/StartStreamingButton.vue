<template>
  <button
    class="button button--go-live"
    :class="{ 'button--soft-warning': isStreaming, 'is-compactMode': isCompactMode }"
    :disabled="isDisabled"
    @click="toggleStreaming"
    v-tooltip.left="isStreaming ? endStreamTooltip : goLiveTooltip"
    data-test="StartStreamingButton"
    :data-test-status="streamingStatus"
  >
    <StartStreamingIcon v-if="isStreaming" />
    <i v-if="!isStreaming" class="icon-live" />
    <span class="button-label" v-if="!isCompactMode">{{ getStreamButtonLabel() }}</span>
  </button>
</template>

<script lang="ts" src="./StartStreamingButton.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.button--go-live {
  min-width: 120px;
  font-size: @font-size4;

  &.is-compactMode {
    min-width: 56px;
  }

  i {
    font-size: @font-size6;
    margin: 0;
  }

  .button-label {
    font-size: @font-size4;
    margin-left: 8px;
  }
}

/deep/ .svg-live {
  width: 18px;
  height: 18px;
  fill: var(--color-text-light);
  vertical-align: middle;
}
</style>
