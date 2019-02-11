import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { HotkeysService } from '../services/hotkeys';
import { ScenesService } from '../services/scenes';
import { SourcesService } from '../services/sources';
import HotkeyGroup from './HotkeyGroup';

@Component({
  components: { HotkeyGroup },
})
export default class Hotkeys extends Vue {
  @Inject()
  sourcesService: SourcesService;

  @Inject()
  scenesService: ScenesService;

  @Inject()
  hotkeysService: HotkeysService;

  hotkeySet = this.hotkeysService.getHotkeysSet();

  created() {
    // We don't want hotkeys registering while trying to bind.
    // We may change our minds on this in the future.
    this.hotkeysService.unregisterAll();
  }

  destroyed() {
    this.hotkeysService.applyHotkeySet(this.hotkeySet);
  }

  get sources() {
    return this.sourcesService.sources;
  }
}
