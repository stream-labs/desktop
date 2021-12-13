<template>
  <div>
    <browser-view
      class="app-store"
      :componentProps="{
        src: appStoreUrl,
        enableGuestApi: true,
        onReady: onBrowserViewReady,
      }"
    />
  </div>
</template>

<script lang="ts" src="./PlatformAppStore.vue.ts"></script>

<style lang="less" scoped>
.app-store {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
