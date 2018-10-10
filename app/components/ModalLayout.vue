<template>
<div class="modal-layout" data-test="ModalLayout">
  <title-bar :title="title" class="modal-layout-titlebar" />
  <div
    class="ModalLayout-fixed"
    :style="fixedStyle">
    <slot name="fixed"/>
  </div>
  <div class="modal-layout-content" :class="{ bareContent }">
    <slot name="content" v-if="!loading"/>
    <i class="icon-spinner icon-spin modal-layout-spinner" v-else/>
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
      @click="doneHandler"
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
  color: @text-primary;
  background-color: @bg-primary;
}

.modal-layout-titlebar {
  flex-shrink: 0;
}

.ModalLayout-fixed {
  flex-shrink: 0;
}

.modal-layout-content {
  flex-grow: 1;
  height: 100%;
  padding: 16px;
  overflow: auto;

  &.bareContent {
    padding: 0;
  }
}

.modal-layout-spinner {
  font-size: 36px;
  display: inline-block;
  width: 100%;
  text-align: center;
  margin: 100px 0;
}

.modal-layout-controls {
  background-color: @bg-primary;
  box-shadow: 0 -5px 10px 2px #2F3340;
  padding: 8px 16px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;

  .button {
    margin-left: 8px;
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
