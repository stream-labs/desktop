import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import { Inject } from 'util/injector';
import TitleBar from './TitleBar.vue';
import { AppService } from 'services/app';
import electron from 'electron';

@Component({
  components: { TitleBar }
})
export default class ModalLayout extends Vue {

  contentStyle: Object = {};
  fixedStyle: Object = {};

  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() appService: AppService;

  // The title shown at the top of the window
  @Prop() title: string;

  // Whether the "cancel" and "done" controls should be
  // shown at the bottom of the modal.
  @Prop({ default: true }) showControls: boolean;

  // If controls are shown, whether or not to show the
  // cancel button.
  @Prop({ default: true }) showCancel: boolean;

  // Will be called when "done" is clicked if controls
  // are enabled
  @Prop() doneHandler: Function;

  // Will be called when "cancel" is clicked.  By default
  // this will just close the window.
  @Prop() cancelHandler: Function;

  // The height of the fixed section
  @Prop() fixedSectionHeight: number;

  /**
   * Set to true when using custom controls.
   * Custom controls go in the "controls" slot.
   */
  @Prop({ default: false })
  customControls: boolean;

  /** Contentにpaddingを持たせない場合 */
  @Prop({ default: false })
  bareContent: boolean;

  created() {
    const fixedStyle = {
      height: (this.fixedSectionHeight || 0).toString() + 'px'
    };

    this.fixedStyle = fixedStyle;

    electron.remote.getCurrentWindow().setTitle(this.title);
  }

  cancel() {
    if (this.cancelHandler) {
      this.cancelHandler();
    } else {
      this.windowsService.closeChildWindow();
    }
  }

  get loading() {
    return this.appService.state.loading;
  }

}
