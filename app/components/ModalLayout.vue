<template>
<div class="modal-layout" :class="{'night-theme': nightTheme}">
  <div
    class="ModalLayout-fixed"
    :style="fixedStyle">
    <slot name="fixed"/>
  </div>
  <div
    class="ModalLayout-content"
    :style="contentStyle">
    <slot name="content"/>
  </div>
  <div v-if="showControls" class="modal-layout-controls">
    <button
      v-if="showCancel"
      class="button button--default"
      @click="cancel">
      Cancel
    </button>
    <button
      class="button button--action"
      @click="doneHandler">
      Done
    </button>
  </div>
</div>
</template>

<script>
import windowManager from '../util/WindowManager.js';
import { CustomizationService } from '../services/customization';

const { remote } = window.require('electron');

export default {

  data() {
    let contentStyle  = {
      padding: '20px',
      overflow: 'auto'
    };

    Object.assign(contentStyle, this.contentStyles);

    let fixedStyle = {
      height: (this.fixedSectionHeight || 0).toString() + 'px'
    };

    return {
      contentStyle,
      fixedStyle
    };
  },

  mounted() {
    remote.getCurrentWindow().setTitle(this.title);
  },

  computed: {
    nightTheme() {
      return CustomizationService.instance.nightMode;
    }
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

  props: {
    // The title shown at the top of the window
    title: {
      type: String
    },

    // Whether the "cancel" and "done" controls should be
    // shown at the bottom of the modal.
    showControls: {
      type: Boolean,
      default: true
    },

    // If controls are shown, whether or not to show the
    // cancel button.
    showCancel: {
      type: Boolean,
      default: true
    },

    // Will be called when "done" is clicked if controls
    // are enabled
    doneHandler: {
      type: Function
    },

    // Will be called when "cancel" is clicked.  By default
    // this will just close the window.
    cancelHandler: {
      type: Function
    },

    // Additional CSS styles for the content section
    contentStyles: {
      type: String
    },

    // The height of the fixed section
    fixedSectionHeight: {
      type: Number
    }
  }

};
</script>

<style lang="less" scoped>
@import "../styles/index";
.modal-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: @grey;
  border-top: 1px solid @day-border;
}

.ModalLayout-fixed {
  flex-shrink: 0;
}

.ModalLayout-content {
  flex-grow: 1;
}

.modal-layout-controls {
  background-color: @day-secondary;
  border-top: 1px solid @day-border;
  padding: 15px 30px;
  text-align: right;
  flex-shrink: 0;
  z-index: 10;
}

.night-theme {
  &.modal-layout {
    background-color: @night-primary;
    border-color: @night-border;
  }
  .modal-layout-controls {
    border-top-color: @night-border;
    background-color: @night-primary;
  }
}
</style>
