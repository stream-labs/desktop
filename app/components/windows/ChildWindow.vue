<template>
<div style="height: 100%">
  <title-bar :title="options.title" class="child-window-titlebar" />
  <div class="blank-slate">
    <div class="spinner-spacer" />
    <i class="fa fa-spinner fa-pulse" />
    <div class="spinner-spacer" />
  </div>
  <div class="child-window-content">
    <component
      v-for="(component, index) in components"
      :key="`${component.name}-${index}`"
      v-if="component.name"
      v-show="component.isShown"
      :is="component.name"/>
  </div>
</div>
</template>

<script lang="ts" src="./ChildWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.blank-slate {
  display: flex;
  flex-direction: column;

  position: absolute;
  height: calc(100% - @titlebar-height); // TitleBarぶんの高さを引く
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
  height: calc(100% - @titlebar-height); // TitleBarぶんの高さを引く
  display: flex;
  flex-direction: column;
}

.spinner-spacer {
  flex-grow: 1;
}
</style>
