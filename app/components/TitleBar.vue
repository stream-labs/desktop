<template>
<div class="titlebar" :class="theme">
  <img class="titlebar-icon" src="../../media/images/icon.ico" />
  <div class="titlebar-title">
    {{ title }}
  </div>
  <div class="titlebar-actions">
    <i class="icon-subtract titlebar-action" @click="minimize" />
    <i v-if="isMaximizable" class="icon-expand-1 titlebar-action" @click="maximize" />
    <i class="icon-close titlebar-action" @click="close" />
  </div>
</div>
</template>

<script lang="ts" src="./TitleBar.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.titlebar {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 30px;
  flex: 0 0 30px;
  background: var(--titlebar);
}

.titlebar-icon {
  padding-left: 16px;
  width: 32px;
}

.titlebar-title {
  flex-grow: 1;
  padding-left: 10px;
  -webkit-app-region: drag;
  color: var(--icon);
}

.titlebar-actions {
  -webkit-app-region: no-drag;
}

.titlebar-action {
  .icon-hover();

  cursor: pointer;
  margin-right: 16px;
}
</style>
