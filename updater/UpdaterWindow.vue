<template>
<div class="UpdaterWindow">
  <i class="UpdaterWindow-icon fa fa-refresh fa-spin"/>
  {{ message }}
  <div v-if="(percentComplete !== null) && !installing && !error" class="UpdaterWindow-progressBarContainer">
    <div
      class="UpdaterWindow-progressBar"
      :style="{ width: percentComplete + '%' }"/>
    <div class="UpdaterWindow-progressPercent">
      {{ percentComplete }}%
    </div>
  </div>
  <div class="UpdaterWindow-issues" v-if="installing">
    This may take a few minutes.  If you are having issues updating, please
    <span class="UpdaterWindow-link" @click="download">
      download a fresh installer.
    </span>
  </div>
  <div class="UpdaterWindow-issues" v-if="error">
    There was an error updating. Please
    <span class="UpdaterWindow-link" @click="download">
      download a fresh installer.
    </span>
  </div>
</div>
</template>

<script>
const { remote, ipcRenderer } = window.require('electron');

export default {

  data() {
    return {
      message: 'Downloading updater...',
      installing: false,
      error: false,
      percentComplete: null
    };
  },

  mounted() {
    ipcRenderer.on('bootstrap-progress', (event, data) => {
      this.percentComplete = Math.floor(data);
    });
  },

  methods: {
    download() {
      remote.shell.openExternal('https://streamlabs.com/streamlabs-obs');
      remote.app.quit();
    }
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

.UpdaterWindow-issues {
  font-size: 13px;
  font-weight: 300;
  padding-top: 25px;
  -webkit-app-region: no-drag;
}

.UpdaterWindow-link {
  color: #bbb;
  cursor: pointer;

  &:hover {
    color: #eee;
  }
}
</style>
