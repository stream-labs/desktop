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

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import electron from '../vendor/electron';
import { CustomizationService } from '../services/customization';
import { Inject } from '../util/injector';

@Component({})
export default class TitleBar extends Vue {

  @Inject()
  customizationService: CustomizationService;

  @Prop()
  title: string;

  minimize() {
    electron.remote.getCurrentWindow().minimize();
  }

  maximize() {
    const win = electron.remote.getCurrentWindow();

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }

  close() {
    electron.remote.getCurrentWindow().close();
  }

  get nightMode() {
    return this.customizationService.nightMode;
  }

}
</script>

<style lang="less" scoped>
@import "../styles/index";

.titlebar {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  -webkit-app-region: drag;
  border-bottom: 1px solid @day-border;
}

.titlebar-icon {
  padding-left: 10px;
  width: 32px;
}

.titlebar-title {
  flex-grow: 1;
  padding-left: 10px;
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
