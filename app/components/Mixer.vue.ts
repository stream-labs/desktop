import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { AudioService } from '../services/audio';
import { Inject } from '../services/core/injector';
import MixerItem from './MixerItem.vue';
import { $t } from 'services/i18n';
import { Menu } from 'util/menus/Menu';

@Component({
  components: { MixerItem },
})
export default class Mixer extends Vue {
  @Inject() audioService: AudioService;

  advancedSettingsTooltip = $t('audio.advancedSettingsTooltip');
  mixerTooltip = $t('audio.mixerTooltip');

  showAdvancedSettings() {
    this.audioService.showAdvancedSettings();
  }

  handleRightClick() {
    const menu = new Menu();
    menu.append({
      id: 'Unhide All',
      label: $t('sources.unhideAll'),
      click: () => this.audioService.unhideAllSourcesForCurrentScene(),
    });
    menu.popup();
  }

  get audioSources() {
    return this.audioService.getSourcesForCurrentScene().filter(source => {
      return !source.mixerHidden;
    });
  }
}
