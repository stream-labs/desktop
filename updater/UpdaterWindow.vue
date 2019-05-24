<template>
<div class="UpdaterWindow">
  <div>
    <i class="UpdaterWindow-icon fas fa-sync-alt fa-spin"/>
    {{ message }}
  </div>
</div>
</template>

<script>
const { remote, ipcRenderer } = window.require('electron');

export default {
  data() {
    return {
      message: 'Checking for updates',
    };
  }
};
</script>

<style lang="less" scoped>
.UpdaterWindow {
  height: 100%;
  padding: 32px;
  background-color: #17242d;
  color: #fff;
  font-size: 18px;
  text-align: center;
  -webkit-app-region: drag;
}

.updater-window__img {
  width: 48px;
}

.UpdaterWindow-icon {
  margin-right: 8px;
}

.UpdaterWindow-link {
  color: #bbb;
  cursor: pointer;

  &:hover {
    color: #eee;
  }
}
</style>
