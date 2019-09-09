<template>
<div id="mainWrapper" class="modal-layout" data-test="ModalLayout">
  <div
    class="ModalLayout-fixed"
    :style="fixedStyle">
    <slot name="fixed"/>
  </div>
  <div class="modal-layout-content" :class="{ bareContent }">
    <slot name="content" v-if="!loading"/>
    <div class="spinner-container" v-else>
      <i class="icon-spinner icon-spin modal-layout-spinner"/>
    </div>
  </div>
  <div v-if="showControls" class="modal-layout-controls">
    <button
      v-if="showCancel"
      class="button button--default"
      @click="cancel"
      data-test="Cancel">
      {{ $t('common.cancel') }}
    </button>
    <button
      class="button button--action"
      @click="done"
      data-test="Done">
      {{ $t('common.done') }}
    </button>
  </div>
  <div v-if="customControls" class="modal-layout-controls">
    <slot name="controls" />
  </div>
</div>
</template>

<script lang="ts" src="./ModalLayout.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.modal-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 2px 2px;
  color: @text-primary;
  background-color: @bg-primary;
}

.ModalLayout-fixed {
  flex-shrink: 0;
  z-index: 1;
}

.modal-layout-content {
  flex-grow: 1;
  height: 100%;
  padding: 16px;
  overflow: auto;
  background-color: @bg-tertiary;
  border-top: 1px solid @bg-tertiary;

  &.bareContent {
    padding: 0;
  }
}

.spinner-container {
  position: absolute;
  width: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.modal-layout-spinner {
  font-size: 36px;
  display: inline-block;
  height: 36px;
}

.modal-layout-controls {
  background-color: @bg-primary;
  box-shadow: 0 -1px 0 rgba(0,0,0,0.1);
  padding: 8px 16px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;

  .button {
    .margin-left();
  }
}

.icon-spin {
  animation: icon-spin 2s infinite linear;
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
