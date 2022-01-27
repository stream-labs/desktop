<template>
  <div class="studio-page" data-test="Studio">
    <template v-if="!compactMode || compactModeTab === 'studio'">
      <div
        v-if="previewEnabled"
        class="studio-mode-container"
        ref="studioModeContainer"
        :class="{ stacked, compactMode }"
      >
        <studio-mode-controls v-if="studioMode" :stacked="stacked" />
        <div class="studio-display-container" :class="{ stacked }">
          <studio-editor class="studio-output-display" />
          <div v-if="studioMode" class="studio-mode-display-container">
            <display class="studio-mode-display" :paddingSize="10" />
          </div>
        </div>
      </div>
      <div v-else class="no-preview">
        <div class="message">
          {{ $t('scenes.previewIsDisabledInPerformanceMode') }}
          <div class="button button--action button--sm" @click="enablePreview">
            {{ $t('scenes.disablePerformanceMode') }}
          </div>
        </div>
      </div>
      <studio-controls />
    </template>
    <template v-if="compactMode && compactModeTab === 'niconico'"> TODO niconico </template>
  </div>
</template>

<script lang="ts" src="./Studio.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.studio-page {
  flex-direction: column;
}

.studio-mode-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  &.compact-mode {
    width: 448px;
  }

  &.stacked {
    flex-direction: row;
  }
}

.studio-display-container {
  flex-grow: 1;
  display: flex;
  padding: @studio-display-padding;

  &.stacked {
    flex-direction: column;
  }
}

.studio-mode-display-container {
  flex-grow: 1;
  position: relative;
}

.studio-mode-display {
  position: absolute;
  width: 100%;
  height: 100%;
}

.no-preview {
  position: relative;
  flex-grow: 1;
  background-color: @bg-tertiary;
  display: flex;
  align-items: center;
  justify-content: center;

  .message {
    max-width: 50%;
    .button {
      margin-top: 20px;
      display: block;
    }
  }
}
</style>
