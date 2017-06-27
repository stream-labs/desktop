<template>
<div>
  <div class="page-container">
    <div class="small-8 columns no-padding-left">
      <div class="small-12">recent events will live here</div>
      <scene-selector class="studio-controls-panel small-6 columns no-padding-left" />
      <source-selector class="studio-controls-panel small-6 columns no-padding-right" />
    </div>
    <div class="small-4 columns no-padding-right">
      chat will be here
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import SourceSelector from '../SourceSelector.vue';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
  }
})
export default class Live extends Vue {
}
</script>
