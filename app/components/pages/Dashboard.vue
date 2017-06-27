<template>
<div>
  <div class="page-container">
    streamlabs dashboard iframe
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
export default class Dashboard extends Vue {
}
</script>
