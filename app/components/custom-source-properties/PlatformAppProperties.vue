<template>
<div class="platform-app-properties">
  <div v-if="app">
    <p>This source is managed by {{ appName }}</p>
    <button @click="navigateApp" class="button button--default">
      Open App Settings
    </button>
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
</style>
