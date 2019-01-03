<template>
  <div>
    <div class="section">
      <div class="section-content">
        <p>{{ $t('If you are experiencing weird behavior, you can try deleting your cache directory. This will result in you losing your scene configuration and settings, but can fix some stability issues.')}}</p>
        <div class="input-container">
          <a class="link" @click="showCacheDir">
            <i class="icon-view"/>
            <span>{{ $t('Show Cache Directory')}}</span>
          </a>
        </div>
        <div class="input-container">
          <a class="link" @click="deleteCacheDir">
            <i class="icon-trash"/>
            <span>{{ $t('Delete Cache and Restart') }}</span>
          </a>
        </div>
        <div class="input-container">
          <a class="link" @click="uploadCacheDir" :disabled="cacheUploading">
            <i class="fa fa-upload"/>
            <span>{{ $t('Upload Cache to Developers') }}</span>
            <i class="fa fa-spinner fa-spin" v-if="cacheUploading"/>
          </a>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-content">
        <ObsBoolInput
          v-if="!isFacebook"
          :value="streamInfoUpdateModel"
          @input="setStreamInfoUpdate"
        />
        <div class="input-container">
          <button
            class="button button--default"
            @click="restartStreamlabelsSession"
          >{{ $t('Restart Streamlabels Session') }}</button>
        </div>
        <div class="input-container" v-if="isTwitch && !isRecordingOrStreaming">
          <button
            class="button button--default"
            @click="runAutoOptimizer"
          >{{ $t('Run Auto Optimizer') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>
