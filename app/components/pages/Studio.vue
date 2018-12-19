<template>
<div class="studio-page" data-test="Studio">
  <div class="studio-mode-container" ref="studioModeContainer" :class="{ stacked }">
    <studio-mode-controls v-if="studioMode" :stacked="stacked" />
    <div
      class="studio-display-container"
      :class="{ stacked }">
      <studio-editor v-if="previewEnabled" class="studio-output-display" />
      <div v-if="studioMode" class="studio-mode-display-container">
        <display class="studio-mode-display" :paddingSize="10" />
      </div>
    </div>
  </div>
  <div v-if="!previewEnabled" class="no-preview">
    <div class="message">
      {{ $t('scenes.previewIsDisabledInPerformanceMode') }}
      <div class="button button--action button--sm" @click="enablePreview">{{ $t('scenes.disablePerformanceMode') }}</div>
    </div>
  </div>
  <studio-controls />
</div>
</template>

<script lang="ts" src="./Studio.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.studio-page {
  display: flex;
  flex-direction: column;
}

.studio-mode-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  &.stacked {
    flex-direction: row;
  }
}

.studio-display-container {
  flex-grow: 1;
  display: flex;

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
      display: block
    }
  }
}
</style>
