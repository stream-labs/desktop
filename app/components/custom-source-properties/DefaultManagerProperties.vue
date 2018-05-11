<template>
<div v-if="mediaFile" class="input-container">
  <div class="input-label">
    <label>Media Backup</label>
  </div>
  <div class="input-wrapper">
    <i class="sync-icon fa" :class="statusDetails.iconClasses" />
    <b>{{ statusDetails.text }}</b>
  </div>
  </div>
</template>

<script lang="ts" src="./DefaultManagerProperties.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.sync-icon {
  color: @teal;
  font-size: 16px;
}
</style>
