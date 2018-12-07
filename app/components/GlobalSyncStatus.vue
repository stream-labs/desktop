<template>
<div
  class="global-sync-status"
  v-tooltip="syncStatusTooltip">
  <i class="fas" :class="syncIcon" />
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

.icon-cloud-backup-2 {
  color: @grey;
}
</style>
