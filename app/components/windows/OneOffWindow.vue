<template>
<div style="height: 100%">
  <title-bar :title="options.title" class="child-window-titlebar" v-if="!isFullScreen" />
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

  background-color: @bg-primary;
  font-size: 24px;
  text-align: center;
}

.child-window-titlebar {
  flex-shrink: 0;
}

.spinner-spacer {
  flex-grow: 1;
}
</style>
