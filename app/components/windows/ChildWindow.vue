<template>
<div style="height: 100%" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}">
  <title-bar :title="options.title" class="child-window-titlebar" />
  <div class="blank-slate">
    <div class="spinner-spacer" />
    <i class="fa fa-spinner fa-pulse" />
    <div class="spinner-spacer" />
  </div>
  <component
    v-for="(component, index) in componentsToRender"
    :key="`${component.name}-${index}`"
    v-show="component.isShown"
    :is="component.name"/>
</div>
</template>

<script lang="ts" src="./ChildWindow.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.blank-slate {
  display: flex;
  flex-direction: column;

  position: absolute;
  height: 100%;
  width: 100%;
  z-index: -1;
  font-size: 24px;
  text-align: center;
}

.blank-slate,
.child-window-titlebar {
  background-color: var(--background);
  color: var(--paragraph);
}

.child-window-titlebar {
  flex-shrink: 0;
}

.spinner-spacer {
  flex-grow: 1;
}
</style>
