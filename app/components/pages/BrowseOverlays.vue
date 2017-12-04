<template>
<div>
  <div class="overlays-container">
    <webview class="overlays" id="overlaysWebview" :src="overlaysUrl"></webview>
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
}

.overlays {
  position: absolute;
  top: -2px;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
