import { CompactModeService } from 'services/compact-mode';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import { SceneCollectionsService } from 'services/scene-collections';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ControlsArrow from '../../media/images/controls-arrow.svg';
import Mixer from './Mixer.vue';
import SceneSelector from './SceneSelector.vue';
import SourceSelector from './SourceSelector.vue';

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
  @Inject() compactModeService: CompactModeService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  get opened() {
    return this.customizationService.studioControlsOpened;
  }

  get isCompactMode() {
    return this.compactModeService.isCompactMode;
  }
  get compactModeStudioController() {
    return this.compactModeService.compactModeStudioController;
  }
  set compactModeStudioController(controller: 'scenes' | 'mixer') {
    this.compactModeService.compactModeStudioController = controller;
  }
  get activeCollection() {
    return this.sceneCollectionsService.activeCollection;
  }

  onToggleControls() {
    this.customizationService.toggleStudioControls();
  }
}
