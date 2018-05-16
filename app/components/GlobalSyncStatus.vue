<template>
<div
  class="global-sync-status"
  v-tooltip="syncStatusTooltip">
  <i class="sync-icon fa" :class="syncIcon" />
</div>
</template>

<script lang="ts" src="./GlobalSyncStatus.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.global-sync-status {
  padding-right: 12px;

  &:before {
    content: '|';
    padding-right: 12px;
    opacity: .5;
    color: @grey;
  }
}

.sync-icon {
  font-size: 16px;
}
</style>
