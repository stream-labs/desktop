<template>
  <div>
    <div class="section">
      <div class="section-content">
        <p>
          {{
            $t(
              'Deleting your cache directory will cause you to lose some settings. Do not delete your cache directory unless instructed to do so by a Streamlabs staff member.',
            )
          }}
        </p>
        <div class="input-container">
          <a class="link" @click="showCacheDir">
            <i class="icon-view" /> <span>{{ $t('Show Cache Directory') }}</span>
          </a>
        </div>
        <div class="input-container">
          <a class="link" @click="deleteCacheDir">
            <i class="icon-trash" /><span>{{ $t('Delete Cache and Restart') }}</span>
          </a>
        </div>
        <div class="input-container">
          <a class="link" @click="uploadCacheDir" :disabled="cacheUploading">
            <i class="fa fa-upload" /> <span>{{ $t('Upload Cache to Developers') }}</span>
            <i class="fa fa-spinner fa-spin" v-if="cacheUploading" />
          </a>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-content">
        <bool-input
          v-if="isLoggedIn && !isFacebook"
          v-model="streamInfoUpdate"
          name="stream_info_udpate"
          :metadata="{ title: $t('Confirm stream title and game before going live') }"
        />
        <bool-input
          v-model="disableHardwareAcceleration"
          name="disable_ha"
          :metadata="{ title: $t('Disable hardware acceleration (requires restart)') }"
        />
        <div class="actions">
          <div class="input-container">
            <button class="button button--default" @click="restartStreamlabelsSession">
              {{ $t('Restart Streamlabels Session') }}
            </button>
          </div>
          <div class="input-container" v-if="isTwitch && !isRecordingOrStreaming">
            <button class="button button--default" @click="runAutoOptimizer">
              {{ $t('Run Auto Optimizer') }}
            </button>
          </div>
          <div class="input-container">
            <button class="button button--action" @click="importFromObs">
              {{ $t('Import from OBS') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/mixins';

.actions {
  .flex();
  .flex--space-between();
  .margin-top();
}
</style>
