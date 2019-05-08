import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services';
import { HotkeysService, IHotkeysSet, IHotkey } from 'services/hotkeys';
import { ScenesService } from '../services/scenes';
import { SourcesService } from '../services/sources';
import HotkeyGroup from './HotkeyGroup';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import Fuse from 'fuse.js';
import mapValues from 'lodash/mapValues';

@Component({
  components: { HotkeyGroup, VFormGroup },
})
export default class Hotkeys extends Vue {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private hotkeysService: HotkeysService;

  hotkeySet: IHotkeysSet = null;

  searchString = '';

  mounted() {
    // We don't want hotkeys registering while trying to bind.
    // We may change our minds on this in the future.
    this.hotkeysService.unregisterAll();

    // Render a blank page before doing synchronous IPC
    setTimeout(() => (this.hotkeySet = this.hotkeysService.getHotkeysSet()), 100);
  }

  destroyed() {
    this.hotkeysService.applyHotkeySet(this.hotkeySet);
  }

  get sources() {
    return this.sourcesService.sources;
  }

  get filteredHotkeySet(): IHotkeysSet {
    if (this.searchString) {
      return {
        general: this.filterHotkeys(this.hotkeySet.general),
        sources: mapValues(this.hotkeySet.sources, hotkeys => this.filterHotkeys(hotkeys)),
        scenes: mapValues(this.hotkeySet.scenes, hotkeys => this.filterHotkeys(hotkeys)),
      };
    }

    return this.hotkeySet;
  }

  private filterHotkeys(hotkeys: IHotkey[]): IHotkey[] {
    return new Fuse(hotkeys, { keys: ['description'], threshold: 0.4 }).search(this.searchString);
  }
}
