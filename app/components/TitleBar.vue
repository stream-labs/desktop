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
const { send } = window.require('electron').ipcRenderer;

export default {

  methods: {
    handleMinimize() {
      send('window.minimize');
    },

    handleMaximize() {
      send('window.maximize');
    },

    handleClose() {
      send('window.close');
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
