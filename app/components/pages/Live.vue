
<template>
<div class="live-container">
  <div class="flex__column">
    <div class="flex__item mission-control-container">
      <webview class="mission-control" id="recentEventsWebview" :src="recenteventsUrl"></webview>
    </div>
    <div class="flex__item studio-controls">
      <scene-selector class="studio-controls-panel no-padding-left" />

      <mixer class="studio-controls-panel" />

      <div class="live-preview-container">
        <div class="studio-controls-top">
          <h4 class="studio-controls__label">
            Preview
          </h4>
          <div>
            <i
              v-if="previewEnabled"
              class="fa fa-eye icon-btn icon-btn--lg"
              @click="previewEnabled = false"/>
            <i
              v-if="!previewEnabled"
              class="fa fa-eye-slash icon-btn icon-btn--lg"
              @click="previewEnabled = true"/>
          </div>
        </div>
        <div class="aspect-ratio--16-9" v-if="previewEnabled">
          <div class="content">
            <display class="live-display" :drawUI="false" />
          </div>
        </div>
        <div class="aspect-ratio--16-9" v-else>
          <div class="content">
            <div class="live-display-placeholder">
              <img class="live-display-placeholder__img live-display-placeholder__img--day" src="media/images/sleeping-kevin-day.png">
              <img class="live-display-placeholder__img live-display-placeholder__img--night" src="media/images/sleeping-kevin-night.png">
              <span>Your preview is currently disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./Live.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";
.live-container {
  display: flex;
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.mission-control-container {
  flex: 1;
  margin-bottom: 20px;
  .radius;
  overflow: hidden;
}

.mission-control {
  height: 100%;
}

.studio-controls {
  height: 200px;
  display: flex;
}

.studio-controls-panel {
  flex-grow: 1;
  flex-basis: 50%;
  padding-left: 0;
  padding-right: 20px;
}

.live-preview-container {
  flex: 0 0 304px;
}

.live-display,
.live-display-placeholder {
  width: 304px;
  height: 171px;
}

.live-display-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: @day-secondary;
  .border;
  .radius;

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
}
</style>