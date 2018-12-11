<template>
<div class="studio-controls row expanded" :class="{ opened }">
  <button @click="onToggleControls" class="studio-controls-toggle-button" :class="{ 'studio-controls--opened': opened }">
    <ControlsArrow />
  </button>
  <template v-if="opened">
    <scene-selector class="studio-controls-panel small-4 columns" />
    <source-selector class="studio-controls-panel small-4 columns" />
    <mixer class="studio-controls-panel small-4 columns" />
  </template>
</div>
</template>

<script lang="ts" src="./StudioControls.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.studio-controls {
  position: relative;
  height: 0;
  width: 100%;
  padding: 16px 8px 0 8px;
  border-top: 1px solid @padding-color;

  svg {
    width: 140px;
    height: 10px;
    transition: .5s;
  }
  &:hover {
    svg {
      transition: .5s;
      width: 160px;
    }
  }
  &.opened {
    height: 196px;
    svg {
      width: 140px;
      height: 10px;
      transform: rotate(0deg);
    }
  }
}

.studio-controls-toggle-button {
  position: absolute;
  background-color: @bg-primary;
  border: 1px solid @bg-secondary;
  border-width: 0 1px 1px 1px;

  width: 180px;
  height: 16px;
  margin: -16px auto 0 auto;
  left: 0;
  right: 0;

  >svg {
    width: 140px;
    height: 10px;
    transform: rotate(180deg);
    fill: @bg-secondary;
    transition: .5s;
  }

  &:hover {
    background-color: @bg-secondary;
    >svg {
      transition: 0.5s;
      width: 160px;
      fill: @text-primary;
    }
  }
}
</style>

<style lang="less">
@import "../styles/index";

.studio-controls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 4px;
  position: relative;
}

.studio-controls-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 16px;
  margin: 4px 0;
}

.studio-controls__label {
  color: @text-primary;
  margin-bottom: 0;
  font-size: 12px;
  .semibold;
}

.studio-controls-selector {
  background: @padding-color;
  .radius;
  flex-grow: 1;
  overflow-y: auto;
}

</style>
