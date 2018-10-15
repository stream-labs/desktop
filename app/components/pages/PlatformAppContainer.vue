<template>
<div class="platform-app-container">
  <PlatformAppWebview
    v-if="!params.poppedOut"
    class="platform-app-webview"
    :appId="params.appId"
    :pageSlot="slot" />
  <div v-else class="platform-app-popped-out">
    This app is currently popped out into an external window.
  </div>
</div>
</template>

<script lang="ts" src="./PlatformAppContainer.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.platform-app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.platform-app-popped-out {
  .padding();
}

.platform-app-controls {
  height: 50px;
  .padding(1);
  background-color: @day-section;
}

.night-theme {
  .platform-app-controls {
    background-color: @night-section;
  }
}

.platform-app-webview {
  flex-grow: 1;
}
</style>
