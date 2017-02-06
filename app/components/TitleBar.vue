<template>
<div class="titlebar">
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
</template>

<script>
const { remote } = window.require('electron');
const thisWindow = remote.getCurrentWindow();

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
  }

};
</script>

<style lang="less" scoped>
.titlebar {
  height: 30px;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  cursor: move;
  text-align: right;
}

.titlebar-action {
  cursor: pointer;
  opacity: 0.6;

  font-size: 16px;
  line-height: 30px;

  margin: 0 8px;

  &:hover {
    opacity: 1.0;
  }
}
</style>
