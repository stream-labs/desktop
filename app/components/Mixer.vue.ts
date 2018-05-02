import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { AudioService } from '../services/audio';
import { Inject } from '../util/injector';
import MixerItem from './MixerItem.vue';

@Component({
  components: { MixerItem }
})
export default class Mixer extends Vue {
  @Inject() audioService: AudioService;

  advancedSettingsTooltip = 'Open advanced audio settings.';
  mixerTooltip = 'Monitor audio levels. If the bars are moving you are outputting audio.';

  showAdvancedSettings() {
    this.audioService.showAdvancedSettings();
  }

  get audioSources() {
    return this.audioService.getSourcesForCurrentScene();
  }
}
