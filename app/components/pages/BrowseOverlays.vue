<template>
<div>
  <div class="overlays-container">
    <webview-loader>
      <webview
        class="overlays"
        id="overlaysWebview"
        :src="overlaysUrl"
        ref="overlaysWebview"
        preload="bundles/guest-api">
      </webview>
    </webview-loader>
  </div>
</div>
</template>

<script lang="ts" src="./BrowseOverlays.vue.ts"></script>

<style lang="less" scoped>
.overlays-container {
  position: absolute;
  top: -1px;
  right: 0;
  bottom: 0;
  left: 0;
  margin-top: 20px;
}

.overlays {
  position: absolute;
  top: -2px;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
