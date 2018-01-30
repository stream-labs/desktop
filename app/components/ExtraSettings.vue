<template>
<div>
  <div class="section">
    <p>If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.</p>
    <div class="margin-bot--20">
      <a class="link link--underlined" @click="showCacheDir">
        <i class="fa fa-eye" /> <span>Show Cache Directory</span>
      </a>
    </div>
    <div class="margin-bot--20">
      <a class="link link--underlined" @click="deleteCacheDir">
        <i class="fa fa-trash" /> <span>Delete Cache and Restart</span></a>
    </div>
    <div class="margin-bot--20">
      <a class="link link--underlined" @click="uploadCacheDir" :disabled="cacheUploading">
        <i class="fa fa-upload" /> <span>Upload Cache to Developers</span>
        <i class="fa fa-spinner fa-spin" v-if="cacheUploading" />
      </a>
    </div>
  </div>
  <div class="section">
    <BoolInput :value="streamInfoUpdateModel" @input="setStreamInfoUpdate" />
    <button class="button button--action" @click="restartStreamlabelsSession">
      Restart Streamlabels Session
    </button>
    <br/>
    <button class="button button--action" @click="runAutoOptimizer" v-if="isTwitch && !isRecordingOrStreaming">
      Run Auto Optimizer
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>
