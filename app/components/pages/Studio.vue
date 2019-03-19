<template>
<div class="studio-page">
  <div v-if="previewEnabled" class="studio-mode-container" ref="studioModeContainer" :class="{ stacked }">
    <studio-mode-controls v-if="studioMode" :stacked="stacked" />
    <div
      class="studio-display-container hidden"
      ref="studioDisplayContainer"
      :class="{ stacked }">
      <studio-editor class="studio-output-display" />
      <div v-if="studioMode" class="studio-mode-display-container">
        <display class="studio-mode-display" :paddingSize="10" />
      </div>
    </div>
  </div>
  <div v-if="!previewEnabled" class="no-preview">
    <div class="message" v-if="performanceMode">
      {{ $t('Preview is disabled in performance mode') }}
      <div class="button button--action button--sm" @click="enablePreview">{{ $t('Disable Performance Mode') }}</div>
    </div>
  </div>
  <resize-bar
    class="studio-resizer"
    position="top"
    v-model="height"
    @onresizestop="onResizeStopHandler()"
    @onresizestart="onResizeStartHandler()"
    :max="maxHeight"
    :min="minHeight"
    :reverse="true"
  />
  <studio-controls :style="{height: height + 'px'}" />
</div>
</template>

<script lang="ts" src="./Studio.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.studio-page {
  flex-direction: column;
  .padding-bottom(2);
}

.studio-resizer {
  margin: 4px 0;
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

.studio-display-container.hidden {
  display: none;
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
  display: flex;
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
