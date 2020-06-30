<template>
  <div>
    <button
      class="button button--go-live button--action"
      :class="{ 'button--soft-warning': getIsRedButton() }"
      :disabled="isDisabled"
      @click="toggleStreaming"
    >
      {{ getStreamButtonLabel() }}
    </button>
  </div>
</template>

<script lang="ts" src="./StartStreamingButton.vue.ts"></script>

<style lang="less" scoped>
.button--go-live {
  min-width: 130px;
}
i {
  margin-right: 0;
}
</style>
