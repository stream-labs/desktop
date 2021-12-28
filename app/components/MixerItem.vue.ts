import { CompactModeService } from 'services/compact-mode';
import { CustomizationService } from 'services/customization';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { AudioSource } from '../services/audio';
import { Inject } from '../services/core/injector';
import { EditMenu } from '../util/menus/EditMenu';
import MixerVolmeter from './MixerVolmeter.vue';
import Slider from './shared/Slider.vue';

@Component({
  components: { Slider, MixerVolmeter },
})
export default class MixerItem extends Vue {
  @Prop() audioSource: AudioSource;

  @Inject() compactModeService: CompactModeService;
  @Inject() private customizationService: CustomizationService;

  get previewEnabled() {
    return !this.customizationService.state.performanceMode;
  }

  get compactMode(): boolean {
    return this.compactModeService.compactMode;
  }

  setMuted(muted: boolean) {
    this.audioSource.setMuted(muted);
  }

  onSliderChangeHandler(newVal: number) {
    this.audioSource.setDeflection(newVal);
  }

  showSourceMenu(sourceId: string) {
    const menu = new EditMenu({
      selectedSourceId: sourceId,
      showAudioMixerMenu: true,
    });
    menu.popup();
  }
}
