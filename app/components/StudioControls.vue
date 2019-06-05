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
  .padding-h-sides();

  height: 240px;
  width: 100%;
  margin: 0;
}
</style>

<style lang="less">
@import "../styles/index";

.studio-controls {
  position: relative;
}

.studio-controls-panel {
  .padding-h-sides();

  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.studio-controls-top {
  .margin-bottom();

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 20px;
}

.studio-controls__label {
  color: var(--title);
  margin-bottom: 0;
}

.studio-controls-selector {
  .radius();

  background: var(--section);
  flex-grow: 1;
  overflow-y: auto;
}
</style>
