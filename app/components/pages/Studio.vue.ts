import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { CustomizationService } from 'services/customization';
import StudioEditor from 'components/StudioEditor.vue';
import StudioControls from 'components/StudioControls.vue';
import { Inject } from 'services/core/injector';
import { TransitionsService } from 'services/transitions';
import Display from 'components/shared/Display.vue';
import StudioModeControls from 'components/StudioModeControls.vue';
import ResizeBar from 'components/shared/ResizeBar.vue';
import { WindowsService } from 'services/windows';
import RecentEvents from 'components/RecentEvents';

@Component({
  components: {
    StudioEditor,
    StudioControls,
    Display,
    StudioModeControls,
    ResizeBar,
    RecentEvents,
  },
})
export default class Studio extends Vue {
  @Inject() private customizationService: CustomizationService;
  @Inject() private transitionsService: TransitionsService;
  @Inject() private windowsService: WindowsService;

  $refs: { studioModeContainer: HTMLDivElement; placeholder: HTMLDivElement };

  stacked = false;
  verticalPlaceholder = false;

  sizeCheckInterval: number;

  maxHeight: number = null;

  mounted() {
    this.reconcileHeightsWithinContraints();

    window.addEventListener('resize', this.windowResizeHandler);

    this.sizeCheckInterval = window.setInterval(() => {
      if (this.studioMode && this.$refs.studioModeContainer) {
        const { clientWidth, clientHeight } = this.$refs.studioModeContainer;

        this.stacked = clientWidth / clientHeight <= 16 / 9;
      }
      if (!this.displayEnabled && !this.performanceMode && this.$refs.placeholder) {
        const { clientWidth, clientHeight } = this.$refs.placeholder;
        this.verticalPlaceholder = clientWidth / clientHeight < 16 / 9;
      }
    }, 1000);
  }

  destroyed() {
    clearInterval(this.sizeCheckInterval);

    window.removeEventListener('resize', this.windowResizeHandler);
  }

  windowResizeHandler() {
    this.reconcileHeightsWithinContraints();
  }

  /**
   * Makes sure both the controls and events heights are reasonable sizes that
   * fit within the window. If controls and events together are larger than the
   * max height, then the events view will be reduced in size until a reasonable
   * minimum, at which point the controls will start being reduced in size.
   */
  reconcileHeightsWithinContraints(isControlsResize = false) {
    // This is the maximum height we can use
    this.maxHeight = this.$root.$el.getBoundingClientRect().height - 400;

    // Roughly 3 lines of events
    const reasonableMinimumEventsHeight = 156;

    // Roughly 1 mixer item
    const reasonableMinimumControlsHeight = 150;

    // Something needs to be adjusted to fit
    if (this.controlsHeight + this.eventsHeight > this.maxHeight) {
      // If we're resizing the controls
      const minEventsHeight = isControlsResize
        ? this.minEventsHeight
        : reasonableMinimumEventsHeight;

      if (this.eventsHeight > minEventsHeight) {
        this.eventsHeight = Math.max(this.maxHeight - this.controlsHeight, minEventsHeight);

        // If we are under max height, we are done
        if (this.controlsHeight + this.eventsHeight <= this.maxHeight) return;
      }

      if (this.controlsHeight > reasonableMinimumControlsHeight) {
        this.controlsHeight = Math.max(
          this.maxHeight - this.eventsHeight,
          reasonableMinimumControlsHeight,
        );

        // If we are under max height, we are done
        if (this.controlsHeight + this.eventsHeight <= this.maxHeight) return;
      }

      // The final strategy is to just split the remaining space
      this.controlsHeight = this.maxHeight / 2;
      this.eventsHeight = this.maxHeight / 2;
    }
  }

  get displayEnabled() {
    return !this.windowsService.state.main.hideStyleBlockers && !this.performanceMode;
  }

  get performanceMode() {
    return this.customizationService.state.performanceMode;
  }

  get studioMode() {
    return this.transitionsService.state.studioMode;
  }

  studioModeTransition() {
    this.transitionsService.executeStudioModeTransition();
  }

  enablePreview() {
    this.customizationService.setSettings({ performanceMode: false });
  }

  get eventsHeight() {
    return this.customizationService.state.eventsSize;
  }

  set eventsHeight(value) {
    this.customizationService.setSettings({ eventsSize: value });
    this.reconcileHeightsWithinContraints();
  }

  get controlsHeight() {
    return this.customizationService.state.controlsSize;
  }

  set controlsHeight(value) {
    this.customizationService.setSettings({ controlsSize: value });
    this.reconcileHeightsWithinContraints(true);
  }

  get minEventsHeight() {
    return 32;
  }

  get minControlsHeight() {
    return 50;
  }

  onResizeStartHandler() {
    this.windowsService.updateStyleBlockers('main', true);
  }

  onResizeStopHandler() {
    this.windowsService.updateStyleBlockers('main', false);
  }
}
