<template>
<div>
  <div class="section">
    <p>{{ $t('If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.')}}</p>
    <div class="margin-bot--20">
      <a class="link" @click="showCacheDir">
        <i class="icon-view" /> <span>{{ $t('Show Cache Directory')}}</span>
      </a>
    </div>
    <div class="margin-bot--20">
      <a class="link" @click="deleteCacheDir">
        <i class="icon-trash" /> <span>{{ $t('Delete Cache and Restart') }}</span></a>
    </div>
    <div class="margin-bot--20">
      <a class="link" @click="uploadCacheDir" :disabled="cacheUploading">
        <i class="fa fa-upload" /> <span>{{ $t('Upload Cache to Developers') }}</span>
        <i class="fa fa-spinner fa-spin" v-if="cacheUploading" />
      </a>
    </div>
  </div>
  <div class="section">
    <ObsBoolInput :value="streamInfoUpdateModel" @input="setStreamInfoUpdate" />
    <button class="button button--action" @click="restartStreamlabelsSession">
      {{ $t('Restart Streamlabels Session') }}
    </button>
    <br/>
    <button class="button button--action" @click="runAutoOptimizer" v-if="isTwitch && !isRecordingOrStreaming">
      {{ $t('Run Auto Optimizer') }}
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>
