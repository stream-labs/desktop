import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import Display from 'components/shared/Display.vue';
import StudioModeControls from 'components/StudioModeControls.vue';
import { TransitionsService } from 'services/transitions';
import { EditorService, IMouseEvent } from 'services/editor';
import { throttle } from 'lodash-decorators';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';
import { ERenderingMode } from '../../obs-api';

@Component({
  components: { Display, StudioModeControls },
})
export default class StudioEditor extends TsxComponent {
  @Inject() private editorService: EditorService;
  @Inject() private transitionsService: TransitionsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private windowsService: WindowsService;

  $refs: {
    display: HTMLDivElement;
    studioModeContainer: HTMLDivElement; // Holds extra display for studio mode
    placeholder: HTMLDivElement; // Holds placeholder image while resizing
  };

  sizeCheckInterval: number;
  stacked = false; // If the studio mode displays are horizontally or vertically oriented
  verticalPlaceholder = false;
  showDisplay = true;

  mounted() {
    this.sizeCheckInterval = window.setInterval(() => {
      if (this.$refs.studioModeContainer) {
        const { clientWidth, clientHeight } = this.$refs.studioModeContainer;
        this.showDisplay = clientHeight > 50;
        if (this.studioMode) {
          this.stacked = clientWidth / clientHeight <= 16 / 9;
        }
      }
      if (!this.displayEnabled && !this.performanceMode && this.$refs.placeholder) {
        const { clientWidth, clientHeight } = this.$refs.placeholder;
        this.verticalPlaceholder = clientWidth / clientHeight < 16 / 9;
      }
    }, 1000);
  }

  destroyed() {
    clearInterval(this.sizeCheckInterval);
  }

  get performanceMode() {
    return this.customizationService.state.performanceMode;
  }

  get displayEnabled() {
    return (
      !this.windowsService.state.main.hideStyleBlockers && !this.performanceMode && this.showDisplay
    );
  }

  get cursor() {
    return this.editorService.state.cursor;
  }

  get studioMode() {
    return this.transitionsService.state.studioMode;
  }

  get renderingMode() {
    return ERenderingMode.OBS_MAIN_RENDERING;
  }

  // Not reactive, don't cache
  getStudioTransitionName() {
    return this.transitionsService.studioTransitionName;
  }

  onOutputResize(region: IRectangle) {
    this.editorService.actions.handleOutputResize(region);
  }

  handleMouseDown(event: MouseEvent) {
    this.editorService.actions.handleMouseDown(this.getMouseEvent(event));
  }

  handleMouseDblClick(event: MouseEvent) {
    this.editorService.actions.handleMouseDblClick(this.getMouseEvent(event));
  }

  handleMouseUp(event: MouseEvent) {
    this.editorService.actions.handleMouseUp(this.getMouseEvent(event));
  }

  handleMouseEnter(event: MouseEvent) {
    this.editorService.actions.handleMouseEnter(this.getMouseEvent(event));
  }

  handleMouseMove(event: MouseEvent) {
    this.throttledHandleMouseMove(event);
  }

  @throttle(20)
  throttledHandleMouseMove(event: MouseEvent) {
    this.editorService.actions.handleMouseMove(this.getMouseEvent(event));
  }

  getMouseEvent(event: MouseEvent): IMouseEvent {
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
      pageX: event.pageX,
      pageY: event.pageY,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      button: event.button,
      buttons: event.buttons,
    };
  }
}
