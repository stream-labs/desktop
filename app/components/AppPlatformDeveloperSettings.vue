<template>
  <div class="app-platform-developer-settings">
    <h2>App Platform</h2>
    <form-group :metadata="appPathMetadata" v-model="appPathValue" />
  </div>
</template>

<script lang="ts" src="./AppPlatformDeveloperSettings.vue.ts"></script>

<style lang="less">
.settings-container {
  .app-platform-developer-settings {
    .input-container {
      flex-direction: row;
    }
  }
}
</style>
