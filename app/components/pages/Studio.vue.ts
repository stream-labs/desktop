import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { CustomizationService } from 'services/customization';
import StudioEditor from 'components/StudioEditor.vue';
import StudioControls from 'components/StudioControls.vue';
import { Inject } from 'util/injector';
import { TransitionsService } from 'services/transitions';
import Display from 'components/shared/Display.vue';
import StudioModeControls from 'components/StudioModeControls.vue';
import { AppService } from 'services/app';

@Component({
  components: {
    StudioEditor,
    StudioControls,
    Display,
    StudioModeControls,
  },
})
export default class Studio extends Vue {
  @Inject() private customizationService: CustomizationService;
  @Inject() private transitionsService: TransitionsService;
  @Inject() appService: AppService;

  $refs: {
    studioModeContainer: HTMLDivElement;
    studioDisplayContainer: HTMLDivElement;
  };

  stacked = false;

  sizeCheckInterval: number;

  mounted() {
    this.sizeCheckInterval = window.setInterval(() => {
      if (this.studioMode) {
        const rect = this.$refs.studioModeContainer.getBoundingClientRect();

        this.stacked = rect.width / rect.height <= 16 / 9;
      }
    }, 1000);

    this.showDisplay();
  }

  destroyed() {
    clearInterval(this.sizeCheckInterval);
  }

  get appLoading() {
    return this.appService.state.loading;
  }

  showDisplay() {
    // Hide the display until loading animation is finished
    if (this.appLoading) {
      requestAnimationFrame(this.showDisplay);
    } else {
      this.$refs.studioDisplayContainer.classList.toggle('hidden');
    }
  }

  get previewEnabled() {
    return this.customizationService.previewEnabled;
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
}
