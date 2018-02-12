<template>
<div class="UpdaterWindow">
  <i class="UpdaterWindow-icon fa fa-refresh fa-spin"/>
  {{ message }}
  <div v-if="percentComplete !== null" class="UpdaterWindow-progressBarContainer">
    <div
      class="UpdaterWindow-progressBar"
      :style="{ width: percentComplete + '%' }"/>
    <div class="UpdaterWindow-progressPercent">
      {{ percentComplete }}%
    </div>
  </div>
</div>
</template>

<script>
const { ipcRenderer } = window.require('electron');

export default {

  data() {
    return {
      message: 'Checking for updates',

      percentComplete: null
    }
  },

  mounted() {
    ipcRenderer.on('autoUpdate-pushState', (event, data) => {
      if (data.version) {
        this.message = `Downloading version ${data.version}`
      }

      if (data.percent) {
        this.percentComplete = Math.round(data.percent);
      }
    });

    ipcRenderer.send('autoUpdate-getState');
  }

};
</script>

<style lang="less" scoped>
.UpdaterWindow {
  height: 100%;
  padding: 40px;
  background-color: #2b383f;
  color: #f3f3f4;
  font-size: 18px;
  text-align: center;
  -webkit-app-region: drag
}

.UpdaterWindow-icon {
  margin-right: 10px;
}

.UpdaterWindow-progressBarContainer {
  position: relative;
  margin-top: 40px;
  background-color: #13242d;
  border-radius: 3px;
  overflow: hidden;
}

.UpdaterWindow-progressBar {
  height: 30px;
  background-color: #31c3a2;
}

.UpdaterWindow-progressPercent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  text-align: center;
  line-height: 30px;
  font-size: 15px;
}
</style>
