<template>
<div class="platform-app-container">
  <webview
    v-if="renderWebview && !poppedOut"
    class="platform-app-webview"
    ref="appView"
    :src="appUrl"
    :partition="appPartition"
    preload="bundles/guest-api" />
  <div v-else class="platform-app-popped-out">
    This app is currently popped out into an external window.
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
</style>
