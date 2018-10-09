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
  .padding-v-sides(2);
  .padding-h-sides();
  margin: 0;
}
</style>

<style lang="less">
@import "../styles/index";

.studio-controls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  .padding-h-sides();
  position: relative;
}

.studio-controls-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  .margin-bottom();
  justify-content: space-between;
  flex: 0 0 16px;
}

.studio-controls__label {
  margin-bottom: 0;
  .weight(@medium);
  color: @day-title;
  font-size: 14px;
}

.selector-list {
  background: @day-section;
  .radius();
  flex-grow: 1;
  overflow-y: auto;
  .margin(@0);
}

.selector-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  .padding-h-sides();
  cursor: pointer;
  justify-content: space-between;
  color: @day-paragraph;
  .transition();
  line-height: 32px;

  &:hover {
    .selector-actions {
      opacity: 1;
    }
  }
}

.selector-item--active {
  background-color: @light-3;
  color: @day-title;
  .weight(@medium);

  .selector-actions {
    opacity: 1;
  }
}

.selector-item__icon,
.selector-item__title {
  float: left;
}

.selector-item__icon {
  display: inline-block;
  text-align: left;
  width: 16px;
  .margin-right();
  color: @icon;
}

.selector-item__title {
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
}

.selector-item__actions {
  display: flex;
  flex-direction: row;
  opacity: .2;
}

.night-theme {
  .selector-list {
    background: @night-section;
  }

  .selector-item {
    color: @night-paragraph;
  }

  .selector-item--active {
    color: @night-title;
  }

  .studio-controls__label {
    color: @white;
  }
}
</style>
