import TsxComponent from 'components/tsx-component';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { Display } from 'components/shared/ReactComponent';
import StudioModeControls from 'components/StudioModeControls.vue';
import { TransitionsService } from 'services/transitions';
import { EditorService, IMouseEvent } from 'services/editor';
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
    this.sizeCheckInterval = window.setInterval(() => this.checkVerticalOrientation(), 1000);
  }

  @Watch('studioMode')
  checkVerticalOrientation() {
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

  enablePreview() {
    this.customizationService.setSettings({ performanceMode: false });
  }

  // Not reactive, don't cache
  getStudioTransitionName() {
    return this.transitionsService.getStudioTransitionName();
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

  lastMoveEvent: IMouseEvent;
  moveInFlight = false;

  handleMouseMove(event: IMouseEvent) {
    if (this.moveInFlight) {
      this.lastMoveEvent = event;
      return;
    }

    this.moveInFlight = true;
    this.editorService.actions.return.handleMouseMove(this.getMouseEvent(event)).then(() => {
      this.moveInFlight = false;

      if (this.lastMoveEvent) {
        this.handleMouseMove(this.lastMoveEvent);
        this.lastMoveEvent = null;
      }
    });
  }

  /**
   * Takes something that looks like a mouse event and cleans it
   * down to the bare minimum for sending over IPC.
   * @param event The mouse event
   */
  getMouseEvent(event: IMouseEvent): IMouseEvent {
    return {
      offsetX: event.offsetX,
      offsetY: event.offsetY,
      pageX: event.pageX,
      pageY: event.pageY,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      button: event.button,
      buttons: event.buttons,
    };
  }
}
