<template>
<div class="platform-app-properties">
  <div v-if="app">
    <p>This source is managed by {{ appName }}</p>
    <button @click="navigateApp" class="button button--default">
      Open App Settings
    </button>
    <div v-if="isUnpacked" class="platform-app-properties-dev-controls">
      <i>For debugging, you may find it easier to test your widget in an external browser.  You may copy/paste the following URL into a browser of your choice.</i>
      <div class="url-input-container">
        <input class="url-input" type="text" readonly :value="browserUrl" />
        <button class="button button--default" @click="copyUrl">Copy</button>
      </div>
    </div>
  </div>
  <div v-else>
    This app has been uninstalled and this source should be removed.
  </div>
</div>
</template>

<script lang="ts" src="./PlatformAppProperties.vue.ts"></script>

<style lang="less" scoped>
.platform-app-properties {
  margin-bottom: 20px;
}

.platform-app-properties-dev-controls {
  padding: 8px 0;
  font-size: 12px;
}

.url-input-container {
  display: flex;
}

.url-input {
  flex-grow: 1;
  margin-right: 8px;
}
</style>
