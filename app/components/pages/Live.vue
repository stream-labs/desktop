
<template>
<div class="live-container">
  <div class="flex__column">
    <div class="flex__item mission-control-container">
      <webview class="mission-control" id="recentEventsWebview" ref="webview" :src="recenteventsUrl"></webview>
    </div>

    <div
      class="flex__item studio-controls"
      :style="{ flex: '0 0 ' + (height) + 'px' }">
      <resize-bar
        position="top"
        v-model="height"
        @onresizestop="onResizeStopHandler()"
        @onresizestart="onResizeStartHandler()"
        :max="maxHeight"
        :min="minHeight"
        :reverse="true"
      />


      <scene-selector class="studio-controls-panel" />

      <mixer class="studio-controls-panel" />

      <div
        class="live-preview-container"
        :style="{ width: previewWidth + 'px' }">
        <resize-bar
          position="left"
          v-model="previewWidth"
          @onresizestop="onResizeStopHandler()"
          @onresizestart="onResizeStartHandler()"
          :min="275"
          :max="600"
          :reverse="true"
        />

        <div class="live-preview-container__content">
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

          <div class="live-display-wrapper sizer-container">
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
</div>
</template>

<script lang="ts" src="./Live.vue.ts"></script>

<style lang="less">
@import '../../styles/index';
.sizer-container {
  width: 100%;
  .radius();
  background-color: var(--section);
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  .border();
  border-top: 0;
  height: calc(~'100% - 29px');
}

.sizer-items {
  position: absolute;
  display: flex;
  align-items: center;
  width: 120px;

  .fa {
    opacity: 0.4;
    font-size: 12px;
  }
}

.sizer {
  width: 100px;
  margin: 0 12px;
  height: auto;
}
</style>

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
  .margin-bottom(2);
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

.sizer-container {
  width: 100%;
  .radius();
  background-color: var(--section);
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  .border();
  border-top: 0;
  height: calc(~'100% - 29px');
}

.sizer-items {
  bottom: 8px;
  right: 8px;
}

.live-preview-container {
  width: 300px;
  flex: 0 0 auto;
  position: relative;
}

.live-preview-container__content {
  height: 100%;
}

.live-display-wrapper {
  width: 100%;
}

.live-display {
  width: 100%;
  height: 100%;
}

.live-display-placeholder {
  height: 100%;
}

.live-display-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

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
}
</style>
