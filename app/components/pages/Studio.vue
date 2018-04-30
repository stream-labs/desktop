<template>
<div class="studio-page">
  <div v-if="studioMode" class="studio-mode-controls">
    <span class="studio-mode-control">
      Edit
    </span>
    <button class="button button--action">
      Transition
      <i class="fa fa-arrow-right" />
    </button>
    <span class="studio-mode-control">
      Live
    </span>
  </div>
  <div class="studio-display-container">
    <studio-editor v-if="previewEnabled" />
    <div v-if="studioMode" class="studio-output-display">
      <display :paddingSize="10" />
    </div>
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

.studio-mode-controls {
  height: 60px;
  display: flex;
  align-items: center;
}

.studio-mode-control {
  flex-grow: 1;
  text-align: center;
  font-size: 16px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.8px;
}

.studio-display-container {
  flex-grow: 1;
  display: flex;
}

.studio-output-display {
  flex-grow: 1;
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
