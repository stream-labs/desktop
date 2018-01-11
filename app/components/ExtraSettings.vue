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
  <div class="section">
    <BoolInput :value="streamInfoUpdateModel" @input="setStreamInfoUpdate" />
    <BoolInput :value="leftDockModel" @input="setLeftDock" />
    <button class="button button--action" @click="restartStreamlabelsSession">
      Restart Streamlabels Session
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>
