<template>
<div class="studio-page">
  <div v-if="displayEnabled" class="studio-mode-container" ref="studioModeContainer" :class="{ stacked }">
    <studio-mode-controls v-if="studioMode" :stacked="stacked" />
    <div
      class="studio-display-container"
      :class="{ stacked }">
      <studio-editor class="studio-output-display" />
      <div v-if="studioMode" class="studio-mode-display-container">
        <display class="studio-mode-display" :paddingSize="10" />
      </div>
    </div>
  </div>
  <div v-else class="no-preview" :style="{ height: `calc(100% - ${height + 18}px)` }">
    <div class="message" v-if="performanceMode">
      {{ $t('Preview is disabled in performance mode') }}
      <div class="button button--action button--sm" @click="enablePreview">{{ $t('Disable Performance Mode') }}</div>
    </div>
    <div ref="placeholder" class="placeholder" v-else>
      <img src="../../../media/images/16x9.png" :class="{ vertical: verticalPlaceholder }" />
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
  height: 100%;
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

.studio-mode-display-container {
  flex-grow: 1;
  position: relative;
}

.studio-mode-display {
  position: absolute;
  width: 100%;
  height: 100%;
}

.placeholder {
  background: var(--section);
  width: 100%;
  height: 100%;
  overflow: hidden;

  img {
    position: relative;
    top: 5px;
    height: calc(100% - 10px);
    width: auto;
    left: 50%;
    transform: translate(-50%, 0);
  }

  img.vertical {
    width: calc(100% - 10px);
    height: auto;
    top: 50%;
    left: 5px;
    transform: translate(0, -50%);
  }
}

.no-preview {
  width: 100%;
  height: 100%;
  position: relative;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  .message {
    max-width: 50%;

    .button {
      margin-top: 20px;
      display: block;
    }
  }
}
</style>
