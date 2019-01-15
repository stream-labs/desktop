import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';
import Mixer from './Mixer.vue';
import ResizeBar from './shared/ResizeBar.vue';
import { Inject } from '../util/injector';
import { CustomizationService } from 'services/customization';
import { Debounce } from 'lodash-decorators';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
    ResizeBar,
    Mixer,
  },
})
export default class StudioControls extends Vue {
  @Inject() customizationService: CustomizationService;

  get height() {
    return this.customizationService.state.bottomdockSize;
  }

  set height(value) {
    this.customizationService.setSettings({ bottomdockSize: value });
  }

  get maxHeight() {
    return this.$root.$el.getBoundingClientRect().height;
  }

  get minHeight() {
    return 50;
  }

  onResizeStartHandler() {
    this.customizationService.setSettings({ previewEnabled: false });
  }

  @Debounce(500) // the preview window is flickering to much without debouncing
  onResizeStopHandler() {
    this.customizationService.setSettings({ previewEnabled: true });
  }
}
