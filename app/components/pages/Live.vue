
<template>
<div class="live-container">
  <div class="flex__column">
    <div class="flex__item mission-control-container">
      <webview class="mission-control" id="recentEventsWebview" ref="webview" :src="recenteventsUrl"></webview>
    </div>
    <resize-bar
      class="flex__item live-page-resizer"
      position="top"
      v-model="height"
      @onresizestop="onResizeStopHandler()"
      @onresizestart="onResizeStartHandler()"
      :max="maxHeight"
      :min="minHeight"
      :reverse="true"
    />
    <div
      class="flex__item studio-controls"
      :style="{ flex: '0 0 ' + (height) + 'px' }">
      <scene-selector class="studio-controls-panel" />

      <mixer class="studio-controls-panel" />

      <div class="live-preview-container">
        <div class="studio-controls-top">
          <h4 class="studio-controls__label">
            {{ $t('Preview') }}
          </h4>
          <div v-if="!performanceModeEnabled">
            <i
              v-if="previewEnabled"
              class="icon-view icon-button icon-button--lg"
              @click="previewEnabled = false"
              v-tooltip="disablePreviewTooltip"/>
            <i
              v-if="!previewEnabled"
              class="icon-hide icon-button icon-button--lg"
              @click="previewEnabled = true"
              v-tooltip="enablePreviewTooltip"/>
          </div>
        </div>

        <div class="live-display-wrapper">
          <img class="live-sizer-image" src="../../../media/images/16x9dummy.png" />
          <display class="live-display" :drawUI="false" v-if="previewEnabled" />
          <div class="live-display-placeholder" v-else>
            <img class="live-display-placeholder__img live-display-placeholder__img--day" src="../../../media/images/sleeping-kevin-day.png">
            <img class="live-display-placeholder__img live-display-placeholder__img--night" src="../../../media/images/sleeping-kevin-night.png">
            <span v-if="!performanceModeEnabled">{{ $t('Your preview is currently disabled') }}</span>
            <span v-if="performanceModeEnabled">{{ $t('Preview is disabled in performance mode') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./Live.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';
.live-container {
  display: flex;
  height: 100%;
  width: 100%;
  .padding(2);
  box-sizing: border-box;
}

.mission-control-container {
  flex: 1;
  .radius();
  overflow: hidden;
  position: relative;
}

.mission-control {
  height: 100%;
}

.studio-controls {
  display: flex;
  position: relative;
  flex: 0 0 208px;
}

.studio-controls-panel {
  flex-basis: 50%;
  padding-left: 0;
  .padding-right(2);
}

.live-page-resizer {
  margin: 4px 0;
}

.live-preview-container {
  flex: 0 0 auto;
  max-width: 60vw;
}

.live-display-wrapper {
  .radius();
  background-color: @day-section;
  position: relative;
  .border();
  border-top: 0;
  height: calc(~'100% - 29px');
}

.live-sizer-image {
  display: block;
  width: auto;
  height: 100%;
  opacity: 0;
}

.live-display {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.live-display-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span {
    color: @grey;
    font-size: 12px;
  }
}

.live-display-placeholder__img {
  margin-bottom: 20px;
  width: 40%;
}

.live-display-placeholder__img--night {
  display: none;
}

.night-theme {
  .mission-control-container {
    border-color: @night-secondary;
  }

  .output-container {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }

  .live-display-placeholder {
    background: @navy-secondary;
    border-color: @navy-secondary;
  }

  .live-display-placeholder__img--day {
    display: none;
  }

  .live-display-placeholder__img--night {
    display: block;
  }

  .live-display-wrapper {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }
}
</style>
