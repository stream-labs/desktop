<template>
<div style="height: 100%" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}">
  <title-bar :title="optios.title" class="child-window-titlebar" v-if="!isFullScreen" />
  <div class="blank-slate">
    <div class="spinner-spacer" />
    <i class="fa fa-spinner fa-pulse" />
    <div class="spinner-spacer" />
  </div>
  <component :is="options.componentName"/>
</div>
</template>

<script lang="ts" src="./OneOffWindow.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.blank-slate {
  display: flex;
  flex-direction: column;

  position: absolute;
  height: 100%;
  width: 100%;
  z-index: -1;

  background-color: @day-primary;
  font-size: 24px;
  text-align: center;
}

.child-window-titlebar {
  flex-shrink: 0;
}

.spinner-spacer {
  flex-grow: 1;
}

.night-theme {
  .child-window-titlebar {
    background-color: @night-primary;
  }
  .blank-slate {
    background-color: @night-primary;
    color: @night-text;
  }
}
</style>
