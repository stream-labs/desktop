import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from 'components/SceneSelector.vue';
import Mixer from 'components/Mixer.vue';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import Display from 'components/shared/Display.vue';
import { CustomizationService } from 'services/customization';
import Slider from 'components/shared/Slider.vue';
import VTooltip from 'v-tooltip';


Vue.use(VTooltip);
VTooltip.options.defaultContainer = '#mainWrapper';

@Component({
  components: {
    SceneSelector,
    Mixer,
    Display,
    Slider
  }
})
export default class Live extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  enablePreviewTooltip = 'Enable the preview stream';
  disablePreviewTooltip = 'Disable the preview stream, can help with CPU';

  get previewSize() {
    return this.customizationService.state.previewSize;
  }

  set previewSize(previewSize: number) {
    this.customizationService.setSettings({ previewSize });
  }

  get previewEnabled() {
    return this.customizationService.state.livePreviewEnabled && !this.performanceModeEnabled;
  }

  get performanceModeEnabled() {
    return this.customizationService.state.performanceMode;
  }

  set previewEnabled(value: boolean) {
    this.customizationService.setLivePreviewEnabled(value);
  }

  get recenteventsUrl() {
    return this.userService.recentEventsUrl();
  }
}
