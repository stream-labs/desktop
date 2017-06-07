<template>
<div>
  <hotkey-group
    :hotkeys="hotkeySet.getGeneralHotkeys()"/>
  <hotkey-group
    v-for="scene in sceneNames"
    :title="scene"
    :hotkeys="hotkeySet.getSceneHotkeys(scene)"/>
  <hotkey-group
    v-for="source in sourceNames"
    v-if="hotkeySet.getSourceHotkeys(source).length > 0"
    :title="source"
    :hotkeys="hotkeySet.getSourceHotkeys(source)"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/service';
import { HotkeySet, HotkeysService } from '../services/hotkeys';
import ScenesService from '../services/scenes';
import { SourcesService } from '../services/sources';
import HotkeyGroup from './HotkeyGroup.vue';

@Component({
  components: { HotkeyGroup }
})
export default class Hotkeys extends Vue {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  hotkeysService: HotkeysService;

  hotkeySet: HotkeySet;

  created() {
    // We don't want hotkeys registering while trying to bind.
    // We may change our minds on this in the future.
    HotkeysService.instance.unregisterAll();
    this.hotkeySet = this.hotkeysService.getHotkeySet();
  }

  destroyed() {
    this.hotkeysService.applyHotkeySet(this.hotkeySet);
  }

  get sceneNames() {
    // TODO: move ScenesService to TypeScript
    return ScenesService.instance.scenes.map((scene: any) => {
      return scene.name;
    });
  }

  get sourceNames() {
    return this.sourcesService.sources.map(source => {
      return source.name;
    });
  }

}
</script>
