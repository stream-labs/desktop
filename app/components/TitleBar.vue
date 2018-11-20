<template>
<div class="titlebar">
  <div class="titlebar-title">
    <LiveIcon v-if="isStreaming" />
    {{ title }}
  </div>
  <div class="titlebar-actions">
    <i class="link icon-minimize titlebar-action" @click="minimize" />
    <i class="link icon-maximize titlebar-action" @click="maximize" />
    <i class="link icon-close titlebar-action" @click="close" />
  </div>
</div>
</template>

<script lang="ts" src="./TitleBar.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.titlebar {
  display: flex;
  flex-direction: row;
  align-items: end;
  padding-top: 6px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.1);
  vertical-align: top;
  z-index: 1;
}

.titlebar-icon {
  padding-left: 8px;
  height: 20px;
}

.titlebar-title {
  flex-grow: 1;
  padding-left: 8px;
  -webkit-app-region: drag;
  color: @text-secondary;
}

.live-status {
  display: inline-block;
  height: 12px;
  animation: live-shadow 3s infinite;
  rect {
    animation: live-color 3s infinite;

  }
}
@keyframes live-color {
 0% { fill: @red;}
 50% { fill: #a50000;}
 100% { fill: @red;}
}
@keyframes live-shadow {
 0% { box-shadow: 0 0 3px 3px rgba(255,0,0,.4);}
 50% { box-shadow: 0 0 0 0 rgba(255,0,0,0);}
 100% { box-shadow: 0 0 3px 3px rgba(255,0,0,.4);}
}

.titlebar-actions {
  -webkit-app-region: no-drag;
  height: 20px;
}

.titlebar-action {
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;
  display: inline-block;
}

</style>
