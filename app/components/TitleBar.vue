<template>
<div class="titlebar" :class="{'night-theme': nightMode}">
  <img class="titlebar-icon" src="../../media/images/icon.ico" />
  <div class="titlebar-title">
    {{ title }}
  </div>
  <div class="titlebar-actions">
    <i class="fa fa-window-minimize titlebar-action" @click="minimize" />
    <i class="fa fa-window-maximize titlebar-action" @click="maximize" />
    <i class="fa fa-window-close titlebar-action" @click="close" />
  </div>
</div>
</template>

<script lang="ts" src="./TitleBar.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.titlebar {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  border-bottom: 1px solid @day-border;
}

.titlebar-icon {
  padding-left: 10px;
  width: 32px;
}

.titlebar-title {
  flex-grow: 1;
  padding-left: 10px;
  -webkit-app-region: drag;
}

.titlebar-actions {
  -webkit-app-region: no-drag;
}

.titlebar-action {
  cursor: pointer;
  opacity: 0.6;
  font-size: 16px;
  margin: 0 8px;

  &:hover {
    opacity: 1.0;
  }
}

.night-theme {
  .titlebar {
    border-color: @night-border;
  }
}
</style>
