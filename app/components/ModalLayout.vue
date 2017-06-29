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

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WindowService } from '../services/window';
import { CustomizationService } from '../services/customization';
import electron from '../vendor/electron';
import { Inject } from '../services/service';

const { remote } = electron;

@Component({})
export default class ModalLayout extends Vue {

  contentStyle: Object = {};
  fixedStyle: Object = {};

  @Inject()
  customizationService: CustomizationService;

  windowService: WindowService = WindowService.instance;

  // The title shown at the top of the window
  @Prop()
  title: string;

  // Whether the "cancel" and "done" controls should be
  // shown at the bottom of the modal.
  @Prop({ default: true })
  showControls: boolean;

  // If controls are shown, whether or not to show the
  // cancel button.
  @Prop({ default: true })
  showCancel: boolean;

  // Will be called when "done" is clicked if controls
  // are enabled
  @Prop()
  doneHandler: Function;

  // Will be called when "cancel" is clicked.  By default
  // this will just close the window.
  @Prop()
  cancelHandler: Function;

  // Additional CSS styles for the content section
  @Prop()
  contentStyles: string;

  // The height of the fixed section
  @Prop()
  fixedSectionHeight: number;


  created() {
    const contentStyle = {
      padding: '20px',
      overflow: 'auto'
    };

    Object.assign(contentStyle, this.contentStyles);

    const fixedStyle = {
      height: (this.fixedSectionHeight || 0).toString() + 'px'
    };

    this.contentStyle = contentStyle;
    this.fixedStyle = fixedStyle;
  }

  mounted() {
    remote.getCurrentWindow().setTitle(this.title);
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  cancel() {
    if (this.cancelHandler) {
      this.cancelHandler();
    } else {
      this.windowService.closeWindow();
    }
  }

}
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
  .button {
    margin-left: 8px;
  }
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
