import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { CustomizationService } from 'services/customization';
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';
import Mixer from './Mixer.vue';
import { Inject } from 'services/core/injector';
import ControlsArrow from '../../media/images/controls-arrow.svg';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
    Mixer,
    ControlsArrow,
  },
})
export default class StudioControls extends Vue {
  @Inject() customizationService: CustomizationService;

  get opened() {
    return this.customizationService.studioControlsOpened;
  }

  get compactMode() {
    return this.customizationService.state.compactMode;
  }
  get compactModeStudioController() {
    return this.customizationService.state.compactModeStudioController;
  }

  onToggleControls() {
    this.customizationService.toggleStudioControls();
  }
}
