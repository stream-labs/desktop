import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { CustomizationService } from 'services/customization';
import StudioEditor from 'components/StudioEditor.vue';
import StudioControls from 'components/StudioControls.vue';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';
import Display from 'components/shared/Display.vue';
import StudioModeControls from 'components/StudioModeControls.vue';
import { AppService } from 'services/app';
import ResizeBar from 'components/shared/ResizeBar.vue';

@Component({
  components: {
    StudioEditor,
    StudioControls,
    Display,
    StudioModeControls,
    ResizeBar,
  },
})
export default class Studio extends Vue {
  @Inject() private customizationService: CustomizationService;
  @Inject() private transitionsService: TransitionsService;
  @Inject() private appService: AppService;

  $refs: { studioModeContainer: HTMLDivElement; placeholder: HTMLDivElement };

  stacked = false;
  verticalPlaceholder = false;

  sizeCheckInterval: number;

  mounted() {
    this.sizeCheckInterval = window.setInterval(() => {
      if (this.studioMode) {
        const { clientWidth, clientHeight } = this.$refs.studioModeContainer;

        this.stacked = clientWidth / clientHeight <= 16 / 9;
      }
      if (!this.displayEnabled && !this.performanceMode) {
        const { clientWidth, clientHeight } = this.$refs.placeholder;
        this.verticalPlaceholder = clientWidth / clientHeight < 16 / 9;
      }
    }, 1000);
  }

  destroyed() {
    clearInterval(this.sizeCheckInterval);
  }

  get displayEnabled() {
    return !this.customizationService.state.hideStyleBlockingElements && !this.performanceMode;
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

  get height() {
    return this.customizationService.state.bottomdockSize;
  }

  set height(value) {
    this.customizationService.setSettings({ bottomdockSize: value });
  }

  get maxHeight() {
    return this.$root.$el.getBoundingClientRect().height - 400;
  }

  get minHeight() {
    return 50;
  }

  onResizeStartHandler() {
    this.customizationService.setSettings({ hideStyleBlockingElements: true });
  }

  onResizeStopHandler() {
    this.customizationService.setSettings({ hideStyleBlockingElements: false });
  }
}
