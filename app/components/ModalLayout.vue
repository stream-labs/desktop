<template>
<div class="ModalLayout">
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
    let contentStyle  = {};

    if (!this.noContentPadding) {
      contentStyle.padding = '30px';
    }

    return {
      contentStyle
    };
  },

  components: {
    TitleBar
  },

  methods: {
    cancel() {
      windowManager.closeWindow();
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

    // Disables padding around the content section
    'noContentPadding'
  ]

};
</script>

<style lang="less" scoped>
.ModalLayout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ModalLayout-titleBar {
  border-bottom: 1px solid #eee;
}

.ModalLayout-content {
  flex-grow: 1;
}

.ModalLayout-controls {
  background-color: #fcfcfc;
  border-top: 1px solid #ededed;
  padding: 15px 30px;
  text-align: right;
}

.ModalLayout-button {
  margin-left: 15px;
}
</style>
