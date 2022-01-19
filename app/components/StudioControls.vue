<template>
  <div class="studio-controls row expanded" :class="{ opened: opened || compactMode }">
    <button
      @click="onToggleControls"
      class="studio-controls-toggle-button"
      :class="{ 'studio-controls--opened': opened }"
      v-if="!compactMode"
    >
      <i class="icon-drop-down-arrow"></i>
    </button>
    <template v-if="compactMode">
      <div class="studio-controls-compact">
        <div class="studio-controls-tabs">
          <a
            @click="compactModeStudioController = 'mixer'"
            class="studio-controls-tab"
            :class="{ active: compactModeStudioController === 'mixer' }"
            >ミキサー</a
          >
          <a
            @click="compactModeStudioController = 'scenes'"
            class="studio-controls-tab"
            :class="{ active: compactModeStudioController === 'scenes' }"
            >{{ activeCollection.name }}</a
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
  .dividing-border;

  position: relative;
  height: 0;
  width: 100%;
  padding: @toggle-button-size 8px 0 8px;
  background-color: var(--color-bg-quinary);

  &.opened {
    height: @studio-controls-opened-height;
    padding-bottom: 16px;
  }

  .isCompactMode & {
    display: flex;
    padding-top: 0;
    width: @nicolive-area-width;
  }
}

.studio-controls-toggle-button {
  position: absolute;
  width: 180px;
  height: @toggle-button-size;
  margin: -@toggle-button-size auto 0 auto;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  > i {
    .icon-hover;
    font-size: @font-size2;
    color: var(--color-icon);
    display: block;
    transform: rotate(-180deg);
  }

  .opened & {
    i {
      transform: rotate(0deg);
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
  padding: 0 8px;
  position: relative;
  flex-grow: 1;
  overflow: auto;
}

.studio-controls-compact {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  .text-ellipsis;
}

.studio-controls-tabs {
  display: flex;
  padding: 0 8px;
}

.studio-controls-tab {
  .text-ellipsis;

  flex: 1 0 50%;
  text-align: center;
  height: 48px;
  line-height: 48px;
  text-decoration: none;
  color: var(--color-text);
  position: relative;
  padding: 0 8px;

  &.active {
    color: var(--color-secondary);

    &:after {
      content: '';
      height: 2px;
      width: 100%;
      position: absolute;
      left: 0;
      bottom: 0;
      background-color: var(--color-secondary);
    }
  }
}

.studio-controls-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 16px;
  height: 16px;
  margin-bottom: 12px;
}

.studio-controls__label {
  color: var(--color-text-light);
  margin-bottom: 0;
  font-size: @font-size4;
  .semibold;
}

.studio-controls-selector {
  background: var(--color-bg-tertiary);
  .radius;
  flex-grow: 1;
  overflow-y: auto;
}
</style>
