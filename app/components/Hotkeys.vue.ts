import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { HotkeysService, IHotkeysSet } from '../services/hotkeys';
import { ScenesService } from '../services/scenes';
import { SourcesService } from '../services/sources';
import HotkeyGroup from './HotkeyGroup';
import { INodeLibuiohook } from 'services/key-listener';
import electron from 'electron';
import { Subject } from 'rxjs';
import { IKeyedBinding } from './shared/Hotkey.vue';

@Component({
  components: { HotkeyGroup },
})
export default class Hotkeys extends Vue {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;
  @Inject() private hotkeysService: HotkeysService;
  private hookLib: INodeLibuiohook;
  mouseKeyPressed: Subject<IKeyedBinding> = new Subject<IKeyedBinding>();

  hotkeySet: IHotkeysSet = null;

  temporaryMouseBindings: string[] = ['MiddleMouseButton', 'X1MouseButton', 'X2MouseButton'];

  mounted() {
    this.hookLib = electron.remote.require('node-libuiohook');
    // We don't want hotkeys registering while trying to bind.
    // We may change our minds on this in the future.
    this.hotkeysService.unregisterAll();

    for (const tempBinding of this.temporaryMouseBindings) {
      // Bind to all different combinations of modifiers
      for (let i = 0; i < 16; i++) {
        const modifier = {
          alt: (i & 1) !== 0,
          ctrl: (i & 2) !== 0,
          shift: (i & 4) !== 0,
          meta: (i & 8) !== 0,
        };
        this.hookLib.registerCallback({
          key: tempBinding,
          eventType: 'registerKeydown',
          callback: () =>
            this.mouseKeyPressed.next({
              key: tempBinding,
              binding: { key: tempBinding, modifiers: modifier },
            }),
          modifiers: modifier,
        });
      }
    }

    // Render a blank page before doing synchronous IPC
    setTimeout(() => {
      this.hotkeySet = this.hotkeysService.getHotkeysSet();
    }, 100);
  }

  destroyed() {
    this.hookLib.unregisterAllCallbacks();
    this.hotkeysService.applyHotkeySet(this.hotkeySet);
  }

  get sources() {
    return this.sourcesService.sources;
  }
}
