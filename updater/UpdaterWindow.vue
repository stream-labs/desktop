<template>
<div class="UpdaterWindow">
  <i18n :path="`${currentState}.message`">
    <br place="br" />
    <span place="version">{{ version }}</span>
  </i18n>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" class="icon-spin"><path d="M59.077.648V11.725a53.139,53.139,0,0,0-33.231,90l13.385-12a35.278,35.278,0,0,1,19.846-60V40.033L90.615,20.34Zm43.077,26.923-13.231,12a35.277,35.277,0,0,1-20,59.846V89.263L37.385,108.956l31.538,19.692V117.571a53.139,53.139,0,0,0,33.231-90Z"/></svg>
  <div v-if="isDownloading && percentComplete !== null" class="UpdaterWindow-progressBarContainer">
    <div
      class="UpdaterWindow-progressBar"
      :style="{ width: percentComplete + '%' }"/>
    <div class="UpdaterWindow-progressPercent">
      {{ percentComplete }}%
    </div>
  </div>
  <div class="UpdaterWindow-issues" v-if="isInstalling || isError">
    <i18n :path="`${currentState}.description`">
      <br place="br" />
      <span class="UpdaterWindow-link" @click="download" place="linkText">
        {{ $t(`${currentState}.linkText`) }}
      </span>
    </i18n>
  </div>
</div>
</template>

<script>
const { remote, ipcRenderer } = window.require('electron');
export default {
  data() {
    return {
      currentState: 'checking',
      version: null,
      percentComplete: null
    };
  },
  computed: {
    isChecking() {
      return this.currentState === 'checking';
    },
    isDownloading() {
      return this.currentState === 'downloading';
    },
    isInstalling() {
      return this.currentState === 'installing';
    },
    isError() {
      return this.currentState === 'error';
    }
  },
  mounted() {
    ipcRenderer.on('autoUpdate-pushState', (event, data) => {
      this.currentState = 'checking';
      this.version = null,
      this.percentComplete = null;
      if (data.version) {
        this.currentState = 'downloading';
        this.version = data.version;
      }
      if (data.percent) {
        this.percentComplete = Math.floor(data.percent);
      }
      if (data.installing) {
        this.currentState = 'installing';
      }
      if (data.error) {
        this.currentState = 'error';
      }
    });
    ipcRenderer.send('autoUpdate-getState');
  },
  methods: {
    download() {
      remote.shell.openExternal('https://site.nicovideo.jp/nicolive/n-air-app/');
      remote.app.quit();
    }
  }
};
</script>

<style lang="less" scoped>
.UpdaterWindow {
  height: 100%;
  padding: 24px;
  background-color: #2F3340;
  color: #9eeaf9;
  font-size: 18px;
  text-align: center;
  -webkit-app-region: drag;
  p {
    white-space: pre-wrap;
    color: #9eeaf9;
  }
}
.UpdaterWindow-progressBarContainer {
  position: relative;
  margin-top: 36px;
  background-color: #050e18;
  border-radius: 3px;
  overflow: hidden;
}
.UpdaterWindow-progressBar {
  height: 24px;
  background-color: #ff6952;
}
.UpdaterWindow-progressPercent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  color: #fff;
  text-align: center;
  line-height: 24px;
  font-size: 15px;
}
.UpdaterWindow-issues {
  font-size: 12px;
  font-weight: 300;
  padding-top: 24px;
  -webkit-app-region: no-drag;
}
.UpdaterWindow-link {
  color: #70A0AF;
  cursor: pointer;
  &:hover {
    color: #9eeaf9;
  }
}
.icon-spin {
  animation: icon-spin 2s infinite linear;
  fill: #9eeaf9;
  width: 22px;
  vertical-align: middle;
}
@keyframes icon-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}
</style>
