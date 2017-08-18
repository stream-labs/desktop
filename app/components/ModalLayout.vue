<template>
<div class="modal-layout" :class="{'night-theme': nightTheme}">
  <title-bar :title="title" class="modal-layout-titlebar" />
  <div
    class="ModalLayout-fixed"
    :style="fixedStyle">
    <slot name="fixed"/>
  </div>
  <div
    class="modal-layout-content"
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
import { Inject } from '../util/injector';
import TitleBar from './TitleBar.vue';

const { remote } = electron;

@Component({
  components: { TitleBar }
})
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
  contentStyles: Dictionary<string>;

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
  }

  .modal-layout-controls {
    border-top-color: @night-border;
    background-color: @night-primary;
  }
}
</style>
