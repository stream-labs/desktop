import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { HotkeysService, IHotkeysSet } from '../services/hotkeys';
import { ScenesService } from '../services/scenes';
import { SourcesService } from '../services/sources';
import HotkeyGroup from './HotkeyGroup';

@Component({
  components: { HotkeyGroup },
})
export default class Hotkeys extends Vue {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private hotkeysService: HotkeysService;

  hotkeySet: IHotkeysSet = null;

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
}
