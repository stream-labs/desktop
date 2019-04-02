<template>
  <div class="app-platform-developer-settings">
    <h2>App Platform</h2>
    <div v-if="currentlyLoadedUnpackedApp">
      <h4>Currently Loaded App</h4>
      <p class="app-platform-details">
        {{ currentlyLoadedUnpackedApp.manifest.name }}
        {{ currentlyLoadedUnpackedApp.manifest.version }}
      </p>
      <h4>Path</h4>
      <p class="app-platform-details">
        {{ currentlyLoadedUnpackedApp.appPath }}
      </p>
      <h4>Token</h4>
      <p class="app-platform-details">
        {{ currentlyLoadedUnpackedApp.appToken }}
      </p>
      <button @click="reloadApp" class="button button--action" :disabled="loading">
        Reload
        <i v-if="loading" class="fa fa-spinner fa-pulse" />
      </button>
      <button @click="unloadApp" class="button button--action" :disabled="loading">
        Unload
        <i v-if="loading" class="fa fa-spinner fa-pulse" />
      </button>
    </div>
    <div v-else>
      <VFormGroup :metadata="appPathMetadata" v-model="appPathValue" />
      <VFormGroup :metadata="appTokenMetadata" v-model="appTokenValue" />
      <button @click="loadApp" class="button button--action" :disabled="loading">
        Load App
        <i v-if="loading" class="fa fa-spinner fa-pulse" />
      </button>
      <div v-if="error" class="app-platform-error">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts" src="./AppPlatformDeveloperSettings.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.app-platform-details {
  word-wrap: break-word;
}

.app-platform-error {
  color: var(--warning);
  font-size: 12px;
}
</style>
