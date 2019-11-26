import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
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
import { UserService } from 'services/user';

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
  @Inject() private userService: UserService;

  $refs: { studioModeContainer: HTMLDivElement; placeholder: HTMLDivElement };

  maxHeight: number = null;

  mounted() {
    this.reconcileHeightsWithinContraints();

    window.addEventListener('resize', this.windowResizeHandler);
  }

  destroyed() {
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
  @Watch('performanceMode')
  reconcileHeightsWithinContraints(isControlsResize = false) {
    const containerHeight = this.$el.getBoundingClientRect().height;

    // This is the maximum height we can use
    this.maxHeight = containerHeight - this.resizeBarNudgeFactor;

    // Roughly 3 lines of events
    const reasonableMinimumEventsHeight = 156;

    // Roughly 1 mixer item
    const reasonableMinimumControlsHeight = 150;

    // Something needs to be adjusted to fit
    if (this.controlsHeight + this.eventsHeight > this.maxHeight) {
      // If we're resizing the controls then we should be more aggressive
      // taking size from events
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

  studioModeTransition() {
    this.transitionsService.executeStudioModeTransition();
  }

  enablePreview() {
    this.customizationService.setSettings({ performanceMode: false });
  }

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  get eventsHeight() {
    return this.isLoggedIn ? this.customizationService.state.eventsSize : 0;
  }

  set eventsHeight(value) {
    if (value === 0) return;
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

  get resizeBarNudgeFactor() {
    return this.isLoggedIn ? 18 : 8;
  }

  onResizeStartHandler() {
    this.windowsService.updateStyleBlockers('main', true);
  }

  onResizeStopHandler() {
    this.windowsService.updateStyleBlockers('main', false);
  }
}
