<template>
<div class="ModalLayout">
  <div class="ModalLayout-spacer"/>
  <title-bar :window-title="title" class="ModalLayout-titleBar"/>
  <div
    class="ModalLayout-content"
    :style="contentStyle">
    <slot name="content"/>
  </div>
  <div v-if="showControls" class="ModalLayout-controls">
    <button
      class="button button--default"
      @click="cancel">
      Cancel
    </button>
    <button
      class="button button--action ModalLayout-button"
      @click="doneHandler">
      Done
    </button>
  </div>
</div>
</template>

<script>
import TitleBar from './TitleBar.vue';
import windowManager from '../util/WindowManager.js';

export default {

  data() {
    let contentStyle  = {
      padding: '30px',
      overflow: 'auto'
    };

    Object.assign(contentStyle, this.contentStyles);

    return {
      contentStyle
    };
  },

  components: {
    TitleBar
  },

  methods: {
    cancel() {
      if (this.cancelHandler) {
        this.cancelHandler();
      } else {
        windowManager.closeWindow();
      }
    }
  },

  props: [
    // The title shown at the top of the window
    'title',

    // Whether the "cancel" and "done" controls should be
    // shown at the bottom of the modal.
    'showControls',

    // Will be called when "done" is clicked if controls
    // are enabled
    'doneHandler',

    // Will be called when "cancel" is clicked.  By default
    // this will just close the window.
    'cancelHandler',

    // Additional CSS styles for the content section
    'contentStyles'
  ]

};
</script>

<style lang="less" scoped>
.ModalLayout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ModalLayout-spacer {
  height: 5px;
}

.ModalLayout-titleBar {
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.ModalLayout-content {
  flex-grow: 1;
}

.ModalLayout-controls {
  background-color: #fcfcfc;
  border-top: 1px solid #ededed;
  padding: 15px 30px;
  text-align: right;
  flex-shrink: 0;
}

.ModalLayout-button {
  margin-left: 15px;
}
</style>
