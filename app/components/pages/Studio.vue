<template>
<div class="studio-page">
  <div class="studio-display-container">
    <studio-editor v-if="previewEnabled" />
  </div>
  <div v-if="!previewEnabled" class="no-preview">
    <div class="message">
      Preview is disabled in performance mode
      <div class="button button--action button--sm" @click="enablePreview">Disable Performance Mode</div>
    </div>

  </div>
  <studio-controls />
</div>
</template>

<script lang="ts" src="./Studio.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.studio-page {
  display: flex;
  flex-direction: column;
}

.studio-display-container {
  flex-grow: 1;
  display: flex;
}

.no-preview {
  position: relative;
  flex-grow: 1;
  background-color: @navy-secondary;
  display: flex;
  align-items: center;
  justify-content: center;

  .message {
    max-width: 50%;
    .button {
      margin-top: 20px;
      display: block
    }
  }
}
</style>
