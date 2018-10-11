<template>
<webview
  v-if="renderWebview"
  class="platform-app-webview"
  ref="appView"
  :src="appUrl"
  :partition="appPartition"
  preload="bundles/guest-api" />
</template>

<script lang="ts" src="./PlatformAppWebview.vue.ts"></script>
<style lang="less" scoped>
@import "../styles/index";

.platform-app-webview {
  flex-grow: 1;
}
</style>
