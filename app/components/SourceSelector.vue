<template>
<div>
  <h4 class="studioControls-label">
    Sources
  </h4>
  <selector
    class="studioControls-selector"
    :items="sourceNames"
    :activeItem="activeSource"/>
</div>
</template>

<script>
import Selector from './Selector.vue';
import _ from 'lodash';

export default {
  components: {
    Selector
  },

  computed: {
    sourceNames() {
      let scene = this.$store.getters.activeScene;
      return _.map(scene.sources, source => source.name);
    },

    activeSource() {
      return undefined;
    }
  }
};
</script>
