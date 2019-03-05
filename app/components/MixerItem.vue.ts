import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { EditMenu } from '../util/menus/EditMenu';
import { AudioSource } from '../services/audio';
import { CustomizationService } from 'services/customization';
import { SliderInput } from 'components/shared/inputs/inputs';
import MixerVolmeter from './MixerVolmeter.vue';
import { Inject } from '../util/injector';

@Component({
  components: { SliderInput, MixerVolmeter },
})
export default class MixerItem extends Vue {
  @Prop() audioSource: AudioSource;

  @Inject() private customizationService: CustomizationService;

  get previewEnabled() {
    return !this.customizationService.state.performanceMode;
  }

  get sliderMetadata() {
    return {
      min: 0,
      max: 1,
      interval: 0.01,
      displayValue: 'false',
    };
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
