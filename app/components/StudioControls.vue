<template>
<div class="studio-controls row expanded">
  <scene-selector class="studio-controls-panel small-4 columns" />
  <source-selector class="studio-controls-panel small-4 columns" />
  <mixer class="studio-controls-panel small-4 columns" />
</div>
</template>

<script lang="ts" src="./StudioControls.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.studio-controls {
  height: 240px;
  width: 100%;
  padding: 20px 10px;
  margin: 0;
}
</style>

<style lang="less">
@import "../styles/index";

.studio-controls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 10px;
  position: relative;
}

.studio-controls-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
  justify-content: space-between;
  flex: 0 0 20px;
}

.studio-controls__label {
  margin-bottom: 0;
  .weight--medium();
  color: @day-title;
}

.studio-controls-selector {
  background: @day-secondary;
  .border();
  .radius();
  flex-grow: 1;
  overflow-y: auto;
}

.night-theme {
  .studio-controls-selector {
    background: @navy-secondary;
    border-color: @navy-secondary;
  }

  .studio-controls__label {
    color: @white;
  }
}
</style>
