<template>
<div style="height: 100%">
  <title-bar :title="options.title" class="child-window-titlebar" v-if="!isFullScreen" />
  <div class="blank-slate">
    <div class="spinner-spacer" />
    <i class="icon-spinner icon-spin modal-layout-spinner"/>
    <div class="spinner-spacer" />
  </div>
  <div class="child-window-content">
    <component :is="options.componentName"/>
  </div>
</div>
</template>

<script lang="ts" src="./OneOffWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.blank-slate {
  display: flex;
  flex-direction: column;

  position: absolute;
  height: calc(~"100% - 26px"); // TitleBarぶんの高さを引く
  width: 100%;
  z-index: -1;

  background-color: @bg-primary;
  font-size: 24px;
  text-align: center;
}

.child-window-titlebar {
  flex-shrink: 0;
}

.child-window-content {
  height: calc(~"100% - 26px"); // TitleBarぶんの高さを引く
}

.spinner-spacer {
  flex-grow: 1;
}
</style>
