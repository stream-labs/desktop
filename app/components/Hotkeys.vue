<template>
<div>
  <hotkey-group
    :hotkeys="hotkeySet.getGeneralHotkeys()"/>
  <hotkey-group
    v-for="scene in sceneNames"
    :title="scene"
    :hotkeys="hotkeySet.getSceneHotkeys(scene)"/>
  <hotkey-group
    v-for="source in sources"
    v-if="hotkeySet.getSourceHotkeys(source.name).length > 0"
    :title="source.displayName"
    :hotkeys="hotkeySet.getSourceHotkeys(source.name)"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { HotkeySet, HotkeysService } from '../services/hotkeys';
import { ScenesService } from '../services/scenes';
import { SourcesService } from '../services/sources';
import HotkeyGroup from './HotkeyGroup.vue';

@Component({
  components: { HotkeyGroup }
})
export default class Hotkeys extends Vue {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  scenesService: ScenesService;

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
    return this.scenesService.scenes.map(scene => scene.name);
  }

  get sources() {
    return this.sourcesService.sources;
  }

  get sourceNames() {
    return this.sources.map(source => {
      return source.name;
    });
  }

}
</script>
