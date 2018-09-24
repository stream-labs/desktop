<template>
<div>
  <div class="app-store-container">
    <webview
      class="app-store"
      v-show="loggedIn"
      id="appStoreWebview"
      :src="appStoreUrl"
      ref="appStore"
      preload="bundles/guest-api">
    </webview>
    <!-- <p v-else>User Not Logged In, Display something here????</p> -->
  </div>
</div>
</template>

<script lang="ts" src="./PlatformAppStore.vue.ts"></script>

<style lang="less" scoped>
.app-store-container {
  position: absolute;
  top: -1px;
  right: 0;
  bottom: 0;
  left: 0;
}

.app-store {
  position: absolute;
  top: -2px;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>

