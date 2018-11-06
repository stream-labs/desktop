<template>
<div
  class="platform-app-container"
  ref="resizeContainer"
  :style="webviewStyles">
  <webview
    v-if="renderWebview && !poppedOut"
    class="platform-app-webview"
    ref="appView"
    :src="appUrl"
    :partition="appPartition"
    preload="bundles/guest-api" />
  <div v-else class="platform-app-popped-out">
    {{ $t("This app is currently popped out into an external window.") }}"
  </div>
  <div class="callout" v-if="callout">
    <i class="fas fa-exclamation-circle"></i> {{ $t("Attention: some apps have Sources that you need to add from the Editor. After setup, we recommended navigating to the Editor and clicking Add Source to check.") }}
    <i class="icon-close" @click="closeCallout()"></i>
  </div>
</div>
</template>

<script lang="ts" src="./PlatformAppWebview.vue.ts"></script>
<style lang="less" scoped>
@import "../styles/index";

.platform-app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.platform-app-popped-out {
  .padding();
}

.platform-app-webview {
  flex-grow: 1;
}

.callout {
  .padding();
  .margin(@0);
  .radius();
  background-color: @info-light;
  color: @info-dark;
  .absolute(auto, 24px, 24px, 24px);
  border: 0;

  .icon-close {
    .absolute(0, @spacing, 0, auto);
    line-height: 37px;
  }
}
</style>
