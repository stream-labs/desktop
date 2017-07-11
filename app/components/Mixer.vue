<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Mixer
    </h4>
  </div>
  <div class="studio-controls-selector mixer-panel">
    <MixerItem v-for="audioSource in audioSources" :audioSource="audioSource" :key="audioSource.name"/>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { AudioService } from '../services/audio';
import { Inject } from '../services/service';
import MixerItem from './MixerItem.vue';

@Component({
  components: { MixerItem }
})
export default class Mixer extends Vue {

  @Inject()
  audioService: AudioService;

  get audioSources() {
    return this.audioService.getSourcesForCurrentScene();
  }

}
</script>

