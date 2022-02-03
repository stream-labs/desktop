<template>
  <div>
    <browser-view
      class="overlays"
      :componentProps="{
        src: overlaysUrl,
        enableGuestApi: true,
        setLocale: true,
        onReady: onBrowserViewReady,
      }"
    />
  </div>
</template>

<script lang="ts" src="./BrowseOverlays.vue.ts"></script>

<style lang="less" scoped>
.overlays {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
