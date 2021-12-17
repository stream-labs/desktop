<template>
  <div class="studio-controls row expanded" :class="{ opened: opened || compactMode }">
    <button
      @click="onToggleControls"
      class="studio-controls-toggle-button"
      :class="{ 'studio-controls--opened': opened }"
      v-if="!compactMode"
    >
      <ControlsArrow />
    </button>
    <template v-if="compactMode">
      <div class="studio-controls-compact">
        <div style="studio-controls-tabs">
          <a
            @click="compactModeStudioController = 'scenes'"
            class="studio-controls-tab"
            :class="{ active: compactModeStudioController === 'scenes' }"
            >scenes</a
          >
          <a
            @click="compactModeStudioController = 'mixer'"
            class="studio-controls-tab"
            :class="{ active: compactModeStudioController === 'mixer' }"
            >mixer</a
          >
        </div>
        <scene-selector
          class="studio-controls-panel"
          v-if="compactModeStudioController === 'scenes'"
        />
        <mixer class="studio-controls-panel" v-if="compactModeStudioController === 'mixer'" />
      </div>
    </template>
    <template v-else-if="opened">
      <scene-selector class="studio-controls-panel small-4 columns" />
      <source-selector class="studio-controls-panel small-4 columns" />
      <mixer class="studio-controls-panel small-4 columns" />
    </template>
  </div>
</template>

<script lang="ts" src="./StudioControls.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.studio-controls {
  position: relative;
  height: 0;
  width: 100%;
  padding: 16px 8px 0 8px;
  border-top: 1px solid @bg-tertiary;

  svg {
    width: 140px;
    height: 10px;
    transition: 0.5s;
  }
  &:hover {
    svg {
      transition: 0.5s;
      width: 160px;
    }
  }
  &.opened {
    height: 196px;
    padding-top: 28px;
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

  > svg {
    width: 140px;
    height: 10px;
    transform: rotate(180deg);
    fill: @text-primary;
    transition: 0.5s;
  }

  .opened & {
    margin-top: -28px;
  }

  &:hover {
    background-color: @bg-secondary;
    > svg {
      transition: 0.5s;
      width: 160px;
      fill: @text-primary;
    }
  }
}
</style>

<style lang="less">
@import '../styles/index';

.studio-controls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 4px;
  position: relative;
}

.studio-controls-compact {
  display: flex;
  flex-direction: column;
}

.studio-controls-tabs {
  display: flex;
  flex-direction: row;
}

.studio-controls-tab {
  padding: 0 4px;

  &.active {
    .bold;
    color: white;
  }
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
  background: @bg-tertiary;
  .radius;
  flex-grow: 1;
  overflow-y: auto;
}
</style>
