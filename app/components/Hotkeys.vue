<template>
<div>
  <hotkey-group
    :hotkeys="hotkeySet.general"/>
  <hotkey-group
    v-for="(scenesHotkeys, sceneId) in hotkeySet.scenes"
    :title="scenesService.getScene(sceneId).name"
    :hotkeys="scenesHotkeys"/>
  <hotkey-group
    v-for="(sourceHotkeys, sourceId) in hotkeySet.sources"
    :title="sourcesService.getSource(sourceId).displayName"
    :hotkeys="sourceHotkeys"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { HotkeysService } from '../services/hotkeys';
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
</script>
