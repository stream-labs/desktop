<template>
<div class="live-container">
  <div class="flex__column">
    <div class="flex__item mission-control-container">
      <webview class="mission-control" id="recentEventsWebview" :src="recenteventsUrl"></webview>
    </div>
    <div class="flex__item sources">
      <scene-selector class="studio-controls-panel small-6 columns no-padding-left" />
      <mixer class="studio-controls-panel small-6 columns no-padding-right" />
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

.sources {
  height: 200px;
}

.night-theme {
  .mission-control-container {
    border-color: @night-secondary;
  }

  .output-container {
    background-color: @night-secondary;
    border-color: @night-secondary;
  }
}
</style>
