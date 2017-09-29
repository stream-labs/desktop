<template>
<div>
  <div class="section">
    <p>
      If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.
    </p>
    <button class="button button--action" @click="showCacheDir">
      Show Cache Directory
    </button>
    <br/>
    <button class="button button--action" @click="deleteCacheDir">
      Delete Cache and Restart
    </button>
    <br/>
    <button class="button button--action" @click="uploadCacheDir" :disabled="cacheUploading">
      Upload Cache to Developers
      <i class="fa fa-spinner fa-spin" v-if="cacheUploading" />
    </button>
  </div>
  <!-- TODO: Uncomment when we want to expose this feature -->
  <!-- <div class="section">
    <p>
      This will export your current scene configuration as a reusable overlay that can be used as a base scene config by other people.  This is an experimental feature.
    </p>
    <button class="button button--action" @click="exportOverlay" :disabled="overlaySaving">
      Export as Overlay
    </button>
  </div> -->
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>
