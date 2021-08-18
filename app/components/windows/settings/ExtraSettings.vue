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
        <bool-input
          v-model="enableCrashDumpUpload"
          :metadata="{ title: $t('Enable reporting additional information on a crash (requires restart)'), name: 'enable_dump_upload'  }"
        />
      </div>
    </div>
    <div class="section">
      <div class="section-content">
        <bool-input
          v-if="isLoggedIn && !isFacebook"
          v-model="streamInfoUpdate"
          :metadata="{ title: $t('Confirm stream title and game before going live'), name: 'stream_info_udpate' }"
        />
        <bool-input
          v-model="disableHardwareAcceleration"
          :metadata="{ title: $t('Disable hardware acceleration (requires restart)'), name: 'disable_ha'  }"
        />
        <div class="actions">
          <div class="input-container">
            <button class="button button--default" @click="restartStreamlabelsSession">
              {{ $t('Restart Stream Labels') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-content">
        <div class="actions">
          <div class="input-container">
            <button class="button button--default" @click="configureDefaults">
              {{ $t('Configure Default Devices') }}
            </button>
          </div>
          <div class="input-container" v-if="isTwitch && !isRecordingOrStreaming && protectedMode">
            <button class="button button--default" @click="runAutoOptimizer">
              {{ $t('Auto Optimize') }}
            </button>
          </div>
          <div class="input-container">
            <button class="button button--default" @click="importFromObs">
              {{ $t('OBS Import') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ExtraSettings.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/mixins';

.actions {
  .flex();
  .flex--space-between();
  .margin-top();

  flex-wrap: wrap;
}
</style>
