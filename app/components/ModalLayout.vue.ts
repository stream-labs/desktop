import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import { Inject } from 'util/injector';
import { AppService } from 'services/app';
import TsxComponent from 'components/tsx-component';

@Component({})
export default class ModalLayout extends TsxComponent<{
  showControls?: boolean;
  showCancel?: boolean;
  showDone?: boolean;
  disableDone?: boolean;
  containsTabs?: boolean;
  doneHandler?: Function;
  cancelHandler?: Function;
  contentStyles?: Dictionary<string>;
  fixedSectionHeight?: number;
  customControls?: boolean;
}> {
  contentStyle: Object = {};
  fixedStyle: Object = {};

  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() appService: AppService;

  // Whether the "cancel" and "done" controls should be
  // shown at the bottom of the modal.
  @Prop({ default: true }) showControls: boolean;

  // If controls are shown, whether or not to show the
  // cancel button.
  @Prop({ default: true }) showCancel: boolean;

  // If controls are shown, whether or not to show the
  // Done button.
  @Prop({ default: true }) showDone: boolean;

  // Disable done button.
  @Prop({ default: false }) disableDone: boolean;

  // If tabs are shown, whether or not to fix
  // the margin.
  @Prop({ default: false }) containsTabs: boolean;

  // Will be called when "done" is clicked if controls
  // are enabled
  @Prop() doneHandler: Function;

  // Will be called when "cancel" is clicked.  By default
  // this will just close the window.
  @Prop() cancelHandler: Function;

  // Additional CSS styles for the content section
  @Prop() contentStyles: Dictionary<string>;

  // The height of the fixed section
  @Prop() fixedSectionHeight: number;

  /**
   * Set to true when using custom controls.
   * Custom controls go in the "controls" slot.
   */
  @Prop({ default: false })
  customControls: boolean;

  created() {
    const contentStyle = {
      padding: '16px',
      overflowY: 'auto',
    };

    Object.assign(contentStyle, this.contentStyles);

    const fixedStyle = {
      height: `${this.fixedSectionHeight || 0}px`,
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
      this.windowsService.closeChildWindow();
    }
  }

  done() {
    if (this.doneHandler) {
      this.doneHandler();
    } else {
      this.windowsService.closeChildWindow();
    }
  }

  get loading() {
    return this.appService.state.loading;
  }
}
