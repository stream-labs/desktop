<template>
<div class="titlebar">
  <div class="titlebar-title">
    {{ windowTitle }}
  </div>
  <div>
    <i
      class="fa fa-window-minimize titlebar-action"
      @click="handleMinimize" />
    <i
      class="fa fa-window-maximize titlebar-action"
      @click="handleMaximize" />
    <i
      class="fa fa-window-close titlebar-action"
      @click="handleClose" />
  </div>
</div>
</template>

<script>
const { getCurrentWindow } = window.require('electron').remote;
const thisWindow = getCurrentWindow();

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
      thisWindow.close();
    }
  },

  props: ['windowTitle']

};
</script>

<style lang="less" scoped>
.titlebar {
  display: flex;
  flex-direction: row;
  align-items: center;

  height: 30px;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  cursor: move;
}

.titlebar-title {
  flex-grow: 1;
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
</style>
