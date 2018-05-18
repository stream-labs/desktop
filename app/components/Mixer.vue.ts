import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { AudioService } from '../services/audio';
import { Inject } from '../util/injector';
import MixerItem from './MixerItem.vue';
import { Menu } from 'util/menus/Menu';

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

  handleRightClick() {
    const menu = new Menu();
    menu.append({
      label: 'Unhide All',
      click: () => this.audioService.unhideAllSourcesForCurrentScene()
    });
    menu.popup();
  }

  get audioSources() {
    return this.audioService.getSourcesForCurrentScene().filter(source => {
      return !source.mixerHidden;
    });
  }
}
