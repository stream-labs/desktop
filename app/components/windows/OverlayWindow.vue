<template>
  <modal-layout :showControls="false" :customControls="true" :hasTitleBar="false">
    <div slot="content" class="overlay-content">
      <div class="overlay-scenes">
        <div>
          <h4>{{ $t('Switch Scenes') }}</h4>
          <div class="scene-selector-wrapper"><scene-selector /></div>
        </div>
      </div>
      <div class="live-preview" v-if="isPreviewEnabled">
        <h4>{{ $t('Preview') }}</h4>
        <display class="live-display" :drawUI="false" />
      </div>
    </div>
    <div slot="controls" class="controls">
      <div class="live-dock-viewer-count">
        <i class="icon-view" />
        <span class="live-dock-viewer-count__count">{{ viewerCount }}</span>
        <span v-if="viewerCount >= 0">{{ $t('viewers') }}</span>
      </div>
      <div><start-streaming-button /></div>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./OverlayWindow.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.overlay-content {
  .flex();
  .flex--space-between();
  height: 90%;

  & > div {
    width: 50%;
  }

  & /deep/ .studio-controls-top {
    display: none;
  }

  & /deep/ .studio-controls-selector {
    background: @day-section;
    .radius();
    flex-grow: 1;
    overflow-y: auto;
  }

  .live-preview {
    width: 100%;
    .margin-horizontal--10();
  }

  .overlay-scenes {
    width: 60%;
  }
}

.controls {
  .flex();
  .flex--center();
  .flex--space-between();
  top: 32px;
}

.night-theme {
  .overlay-content {
    & /deep/ .studio-controls-selector {
      background: @night-section;
    }
  }
}

.live-dock-viewer-count {
  .flex();
  .flex--center();

  i {
    .margin-right();
  }

  .live-dock-viewer-count__count {
    margin-right: 4px;
  }
}

.live-display {
  .flex--justify-start();
  width: 100%;

  & /deep/ * {
    background: none !important;
  }
}

& /deep/ .modal-layout {
  height: 100% !important;
}
</style>
