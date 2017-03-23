<template>
<div class="Titlebar">
  <div class="Titlebar-title">
    {{ windowTitle }}
  </div>
  <div>
    <i
      class="fa fa-window-minimize Titlebar-action"
      @click="handleMinimize" />
    <i
      class="fa fa-window-maximize Titlebar-action"
      @click="handleMaximize" />
    <i
      class="fa fa-window-close Titlebar-action"
      @click="handleClose" />
  </div>
</div>
</template>

<script>
const { getCurrentWindow } = window.require('electron').remote;
const thisWindow = getCurrentWindow();
import windowManager from '../util/WindowManager.js';

let maximized = false;

export default {

  methods: {
    handleMinimize() {
      thisWindow.minimize();
    },

    handleMaximize() {
      if (maximized) {
        thisWindow.unmaximize();
        maximized = false;
      } else {
        thisWindow.maximize();
        maximized = true;
      }
    },

    handleClose() {
      windowManager.closeWindow();
    }
  },

  props: ['windowTitle']

};
</script>

<style lang="less" scoped>
.Titlebar {
  display: flex;
  flex-direction: row;
  align-items: center;

  height: 30px;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  cursor: move;
}

.Titlebar-title {
  flex-grow: 1;
  padding-left: 30px;
}

.Titlebar-action {
  cursor: pointer;
  opacity: 0.6;

  font-size: 16px;

  margin: 0 8px;

  -webkit-app-region: no-drag;

  &:hover {
    opacity: 1.0;
  }
}
</style>
