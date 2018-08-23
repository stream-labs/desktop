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
      <button class="button button--action">
        Reload
      </button>
      <button @click="unloadApp" class="button button--action">
        Unload
      </button>
    </div>
    <div v-else>
      <VFormGroup :metadata="appPathMetadata" v-model="appPathValue" />
      <VFormGroup :metadata="appTokenMetadata" v-model="appTokenValue" />
      <button @click="loadApp" class="button button--action">
        Load App
      </button>
    </div>
  </div>
</template>

<script lang="ts" src="./AppPlatformDeveloperSettings.vue.ts"></script>

<style lang="less" scoped>
.app-platform-details {
  word-wrap: break-word;
}
</style>
